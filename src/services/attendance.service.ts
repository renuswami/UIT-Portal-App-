import { salesforceApi } from '../api/salesforce.api';

export interface AttendanceRecord {
    date: string;
    status: string;
    workHours: string;
    hasRegularization: boolean;
    id: string;
}

export interface LeaveRecord {
    id?: string;
    startDate: string;
    endDate: string;
    type: string;
    dayType?: string;
    status?: string;
    totalDays?: number;
    description?: string;
}

export interface HolidayRecord {
    date: string;
    name: string;
}

export interface RegularizationRecord {
    id: string;
    date: string;
    attendanceId: string;
    checkIn: string;
    checkOut: string;
    reasonType: string;
    description: string;
    logHours: number;
    approvalStatus: string;
}

export const attendanceService = {
    async getUserIdByEmail(username: string): Promise<{ userId: string; accountId: string | null }> {
        console.log(`[AttendanceService] Resolving IDs for Username: ${username}`);

        // 1. Get AccountId from Authentication_Detail__c
        const authQuery = `SELECT Account__c FROM Authentication_Detail__c WHERE Username__c = '${username}' LIMIT 1`;
        const authRes = await salesforceApi.query(authQuery);

        let accountId: string | null = null;
        if (authRes.records && authRes.records.length > 0) {
            accountId = authRes.records[0].Account__c;
        }

        // 2. Get User ID by Username
        const userQuery = `SELECT Id FROM User WHERE Username = '${username}' OR Email = '${username}' LIMIT 1`;
        const userRes = await salesforceApi.query(userQuery);

        if (userRes.records && userRes.records.length > 0) {
            const userId = userRes.records[0].Id;
            console.log(`[AttendanceService] Resolved: userId=${userId}, accountId=${accountId}`);
            return { userId, accountId };
        }

        if (accountId) {
            // Fallback: If we have accountId but no User record, we might still be able to proceed for some queries
            console.warn(`[AttendanceService] No User record found for ${username}, but found Account: ${accountId}`);
            return { userId: '', accountId };
        }

        console.error(`[AttendanceService] No user or account found for: ${username}`);
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

    async fetchAllLeaves(accountId: string): Promise<LeaveRecord[]> {
        console.log(`[AttendanceService] Fetching All Leaves for Account: ${accountId}`);
        const query = `SELECT Id, Start_Date__c, End_Date__c, Leave_Type__c, Leave_Status__c, Total_Days__c, Description__c FROM Leave__c WHERE Employee__c = '${accountId}' ORDER BY Start_Date__c DESC`;
        const res = await salesforceApi.query(query);
        return res.records.map((r: any) => ({
            id: r.Id,
            startDate: r.Start_Date__c,
            endDate: r.End_Date__c,
            type: r.Leave_Type__c,
            status: r.Leave_Status__c,
            totalDays: r.Total_Days__c || 0,
            description: r.Description__c || ''
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

    async fetchMonthlyData(year: number, month: number, accountId: string) {
        console.log(`[AttendanceService] Fetching Monthly Data for ${month}/${year}, Account: ${accountId}`);
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        // Fetch Attendance
        const attendanceQuery = `SELECT Id, Attendance_Date__c, Status__c, Work_Hours__c FROM Attendance__c WHERE Employee__c = '${accountId}' AND Attendance_Date__c >= ${startDate} AND Attendance_Date__c <= ${endDate}`;
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
        const leaveQuery = `SELECT Start_Date__c, End_Date__c, Leave_Type__c, Day_Type__c FROM Leave__c WHERE Start_Date__c <= ${endDate} AND End_Date__c >= ${startDate} AND Employee__c = '${accountId}'`;
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
    },

    async fetchAttendanceByDate(date: string, accountId: string): Promise<AttendanceRecord | null> {
        console.log(`[AttendanceService] Fetching Attendance for Date: ${date}, Account: ${accountId}`);
        const query = `SELECT Id, Attendance_Date__c, Status__c, Work_Hours__c FROM Attendance__c WHERE Employee__c = '${accountId}' AND Attendance_Date__c = ${date} LIMIT 1`;
        const res = await salesforceApi.query(query);
        if (res.records && res.records.length > 0) {
            const r = res.records[0];
            return {
                id: r.Id,
                date: r.Attendance_Date__c,
                status: r.Status__c,
                workHours: r.Work_Hours__c,
                hasRegularization: false,
            };
        }
        return null;
    },

    async checkRegularizationExists(attendanceId: string): Promise<boolean> {
        console.log(`[AttendanceService] Checking Regularization for Attendance: ${attendanceId}`);
        const query = `SELECT Id FROM Regularization__c WHERE AttendanceId__c = '${attendanceId}' LIMIT 1`;
        const res = await salesforceApi.query(query);
        return res.records && res.records.length > 0;
    },

    async createRegularization(payload: {
        attendanceId: string;
        checkIn: string;
        checkOut: string;
        reasonType: string;
        description: string;
        logHours: number;
    }): Promise<any> {
        console.log(`[AttendanceService] Creating Regularization for Attendance: ${payload.attendanceId}`);

        // Remove milliseconds for better Salesforce compatibility
        const formatDT = (iso: string) => iso.includes('.') ? iso.split('.')[0] + 'Z' : iso;

        return await salesforceApi.create('Regularization__c', {
            AttendanceId__c: payload.attendanceId,
            Check_in__c: formatDT(payload.checkIn),
            Check_out__c: formatDT(payload.checkOut),
            Reason_Type__c: payload.reasonType,
            Description__c: payload.description,
            Log_Hours__c: payload.logHours,
            Approval_Status__c: 'Pending',
        });
    },

    async fetchMyRegularizations(accountId: string): Promise<RegularizationRecord[]> {
        console.log(`[AttendanceService] Fetching Regularizations for Account: ${accountId}`);
        const query = `SELECT Id, AttendanceId__c, AttendanceId__r.Attendance_Date__c, Check_in__c, Check_out__c, Reason_Type__c, Description__c, Log_Hours__c, Approval_Status__c FROM Regularization__c WHERE AttendanceId__r.Employee__c = '${accountId}' ORDER BY CreatedDate DESC`;
        const res = await salesforceApi.query(query);
        return res.records.map((r: any) => ({
            id: r.Id,
            date: r.AttendanceId__r?.Attendance_Date__c || '',
            attendanceId: r.AttendanceId__c,
            checkIn: r.Check_in__c,
            checkOut: r.Check_out__c,
            reasonType: r.Reason_Type__c,
            description: r.Description__c,
            logHours: r.Log_Hours__c,
            approvalStatus: r.Approval_Status__c,
        }));
    },
    async createLeave(payload: {
        accountId: string;
        startDate: string;
        endDate: string;
        type: string;
        dayType: string;
        description: string;
        totalDays: number;
    }): Promise<any> {
        console.log(`[AttendanceService] Creating Leave for Account: ${payload.accountId}`);
        return await salesforceApi.create('Leave__c', {
            Employee__c: payload.accountId,
            Start_Date__c: payload.startDate,
            End_Date__c: payload.endDate,
            Leave_Type__c: payload.type,
            Day_Type__c: payload.dayType,
            Description__c: payload.description,
            Total_Days__c: payload.totalDays,
            Leave_Status__c: 'Pending',
        });
    },

    async fetchProfileDetails(accountId: string): Promise<any> {
        console.log(`[AttendanceService] Fetching Profile Details for Account: ${accountId}`);
        const query = `
            SELECT 
                Id, Salutation, FirstName, LastName, PersonEmail, PersonMobilePhone, PersonHomePhone, 
                PersonBirthdate, PersonGenderIdentity, Aadhar_Number__c, PAN_Number__c, 
                UAN_Number__c, Current_Address__c, Permanent_Address__c, City__c, States_Union_Territories__c, 
                Country__c, Emergency_Contact_Name__c, Emergency_Contact_Phone_Number__c, Emergency_Contact_Relation__c, 
                Account_ID__c, Position__c, Level__pc, PersonDepartment, Joining_Date__c, Reporting_To__r.Name, 
                Status__c, Total_Experience__c, Current_Experience__c, Previous_Experience__c,
                Sick_Leave_Balance__c, Casual_Leave_Balance__c, Optional_Leaves_Balance__c
            FROM Account 
            WHERE Id = '${accountId}' 
            LIMIT 1
        `;
        const res = await salesforceApi.query(query);
        return res.records && res.records.length > 0 ? res.records[0] : null;
    },
};
