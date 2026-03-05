import { salesforceApi } from '../api/salesforce.api';

export interface AttendanceRecord {
    date: string;
    status: string;
    workHours: string;
    hasRegularization: boolean;
    id: string;
}

export interface LeaveRecord {
    startDate: string;
    endDate: string;
    type: string;
    dayType: string;
    status?: string;
}

export interface HolidayRecord {
    date: string;
    name: string;
}

export const attendanceService = {
    async getUserIdByEmail(email: string): Promise<{ userId: string; accountId: string | null }> {
        console.log(`[AttendanceService] Resolving User ID for: ${email}`);
        const query = `SELECT Id, AccountId FROM User WHERE Email = '${email}' LIMIT 1`;
        const res = await salesforceApi.query(query);
        if (res.records && res.records.length > 0) {
            console.log(`[AttendanceService] Resolved: userId=${res.records[0].Id}, accountId=${res.records[0].AccountId}`);
            return {
                userId: res.records[0].Id,
                accountId: res.records[0].AccountId
            };
        }
        console.error(`[AttendanceService] No user found for: ${email}`);
        throw new Error('User not found in Salesforce');
    },

    async fetchLeaveBalances(accountId: string) {
        console.log(`[AttendanceService] Fetching Leave Balances for Account: ${accountId}`);
        try {
            const query = `SELECT Sick_Leave_Balance__c, Casual_Leave_Balance__c, Optional_Leaves_Balance__c FROM Account WHERE Id = '${accountId}' LIMIT 1`;
            const res = await salesforceApi.query(query);

            if (res.records && res.records.length > 0) {
                const r = res.records[0];
                console.log(`[AttendanceService] Fetched Balances: Sick=${r.Sick_Leave_Balance__c}, Casual=${r.Casual_Leave_Balance__c}, Optional=${r.Optional_Leaves_Balance__c}`);
                return {
                    sick: r.Sick_Leave_Balance__c || 0,
                    casual: r.Casual_Leave_Balance__c || 0,
                    optional: r.Optional_Leaves_Balance__c || 0
                };
            }
        } catch (error) {
            console.error(`[AttendanceService] Error fetching leave balances:`, error);
        }
        return { sick: 0, casual: 0, optional: 0 };
    },

    async fetchAllLeaves(userId: string): Promise<LeaveRecord[]> {
        console.log(`[AttendanceService] Fetching All Leaves for User: ${userId}`);
        const query = `SELECT Start_Date__c, End_Date__c, Leave_Type__c, Leave_Status__c FROM Leave__c WHERE User = '${userId}' ORDER BY Start_Date__c DESC`;
        const res = await salesforceApi.query(query);
        return res.records.map((r: any) => ({
            startDate: r.Start_Date__c,
            endDate: r.End_Date__c,
            type: r.Leave_Type__c,
            status: r.Leave_Status__c
        }));
    },

    async fetchAllHolidays(): Promise<HolidayRecord[]> {
        console.log(`[AttendanceService] Fetching All Holidays`);
        const query = `SELECT Date__c, Name FROM Holiday__c WHERE Date__c = THIS_YEAR ORDER BY Date__c DESC`;
        const res = await salesforceApi.query(query);
        return res.records.map((r: any) => ({
            date: r.Date__c,
            name: r.Name
        }));
    },

    async fetchMonthlyData(year: number, month: number, userId: string, email: string) {
        console.log(`[AttendanceService] Fetching Monthly Data for ${month}/${year}, User: ${userId}`);
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // Fetch Attendance
        const attendanceQuery = `SELECT Id, Attendance_Date__c, Status__c, Work_Hours__c FROM Attendance__c WHERE Employee__r.PersonEmail = '${email}' AND Attendance_Date__c >= ${startDate} AND Attendance_Date__c <= ${endDate}`;
        console.log(`[AttendanceService] Attendance Query: ${attendanceQuery}`);
        const attendanceRes = await salesforceApi.query(attendanceQuery);
        console.log(`[AttendanceService] Found ${attendanceRes.records.length} attendance records`);
        const attendance: Record<string, AttendanceRecord> = {};
        const attendanceIds: string[] = [];
        attendanceRes.records.forEach((r: any) => {
            attendanceIds.push(r.Id);
            attendance[r.Attendance_Date__c] = {
                id: r.Id,
                date: r.Attendance_Date__c,
                status: r.Status__c,
                workHours: r.Work_Hours__c,
                hasRegularization: false, // default; updated below
            };
        });

        // Fetch Regularizations for fetched attendance records
        if (attendanceIds.length > 0) {
            const idList = attendanceIds.map(id => `'${id}'`).join(',');
            const regularizationQuery = `SELECT AttendanceId__c FROM Regularization__c WHERE AttendanceId__c IN (${idList})`;
            console.log(`[AttendanceService] Regularization Query: ${regularizationQuery}`);
            try {
                const regRes = await salesforceApi.query(regularizationQuery);
                const regularizedIds = new Set(regRes.records.map((r: any) => r.AttendanceId__c));
                Object.values(attendance).forEach(rec => {
                    if (regularizedIds.has(rec.id)) {
                        rec.hasRegularization = true;
                    }
                });
                console.log(`[AttendanceService] Found ${regRes.records.length} regularization records`);
            } catch (e) {
                console.warn('[AttendanceService] Could not fetch regularization records:', e);
            }
        }

        // Fetch Holidays
        const holidayQuery = `SELECT Date__c, Name FROM Holiday__c WHERE Date__c >= ${startDate} AND Date__c <= ${endDate}`;
        console.log(`[AttendanceService] Holiday Query: ${holidayQuery}`);
        const holidayRes = await salesforceApi.query(holidayQuery);
        console.log(`[AttendanceService] Found ${holidayRes.records.length} holiday records`);
        const holidays: Record<string, HolidayRecord> = {};
        holidayRes.records.forEach((r: any) => {
            holidays[r.Date__c] = {
                date: r.Date__c,
                name: r.Name
            };
        });

        // Fetch Leaves
        const leaveQuery = `SELECT Start_Date__c, End_Date__c, Leave_Type__c, Day_Type__c FROM Leave__c WHERE Start_Date__c <= ${endDate} AND End_Date__c >= ${startDate} AND Employee__r.PersonEmail = '${email}'`;
        console.log(`[AttendanceService] Leave Query: ${leaveQuery}`);
        const leaveRes = await salesforceApi.query(leaveQuery);
        console.log(`[AttendanceService] Found ${leaveRes.records.length} leave records`);
        const leaves: Record<string, LeaveRecord[]> = {};
        leaveRes.records.forEach((r: any) => {
            // Expand date range so every calendar day in the leave gets an entry
            const start = new Date(r.Start_Date__c);
            const end = new Date(r.End_Date__c);
            const record: LeaveRecord = {
                startDate: r.Start_Date__c,
                endDate: r.End_Date__c,
                type: r.Leave_Type__c,
                dayType: r.Day_Type__c
            };
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const key = d.toISOString().split('T')[0];
                if (!leaves[key]) leaves[key] = [];
                leaves[key].push(record);
            }
        });

        return { attendance, holidays, leaves };
    }
};
