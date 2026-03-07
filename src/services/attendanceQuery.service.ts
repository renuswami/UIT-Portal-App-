import { salesforceApi } from '../api/salesforce.api';
import { AppError, getErrorMessage } from '../utils/errors';

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

interface UserRecord {
    Id: string;
    AccountId: string | null;
}

interface LeaveBalanceRecord {
    Sick_Leave_Balance__c?: number;
    Casual_Leave_Balance__c?: number;
    Optional_Leaves_Balance__c?: number;
}

interface AttendanceMonthlyRecord {
    Id: string;
    Attendance_Date__c: string;
    Status__c: string;
    Work_Hours__c: string;
}

interface RegularizationRecord {
    AttendanceId__c: string;
}

interface HolidaySfRecord {
    Date__c: string;
    Name: string;
}

interface LeaveSfRecord {
    Start_Date__c: string;
    End_Date__c: string;
    Leave_Type__c: string;
    Leave_Status__c?: string;
    Day_Type__c: string;
}

const escapeSoqlLiteral = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

export const attendanceQueryService = {
    async getUserIdByEmail(email: string): Promise<{ userId: string; accountId: string | null }> {
        const escapedEmail = escapeSoqlLiteral(email);
        const query = `SELECT Id, AccountId FROM User WHERE Email = '${escapedEmail}' LIMIT 1`;
        const res = await salesforceApi.query<UserRecord>(query);

        if (!res.records?.length) {
            throw new AppError('User not found in Salesforce', 'SF_USER_NOT_FOUND');
        }

        return {
            userId: res.records[0].Id,
            accountId: res.records[0].AccountId
        };
    },

    async fetchLeaveBalances(accountId: string): Promise<{ sick: number; casual: number; optional: number }> {
        try {
            const escapedAccountId = escapeSoqlLiteral(accountId);
            const query = `SELECT Sick_Leave_Balance__c, Casual_Leave_Balance__c, Optional_Leaves_Balance__c FROM Account WHERE Id = '${escapedAccountId}' LIMIT 1`;
            const res = await salesforceApi.query<LeaveBalanceRecord>(query);

            if (!res.records?.length) {
                return { sick: 0, casual: 0, optional: 0 };
            }

            const record = res.records[0];
            return {
                sick: record.Sick_Leave_Balance__c || 0,
                casual: record.Casual_Leave_Balance__c || 0,
                optional: record.Optional_Leaves_Balance__c || 0
            };
        } catch (error) {
            throw new AppError(getErrorMessage(error, 'Failed to fetch leave balances'), 'SF_LEAVE_BALANCE_FAILED', error);
        }
    },

    async fetchAllLeaves(userId: string): Promise<LeaveRecord[]> {
        const escapedUserId = escapeSoqlLiteral(userId);
        const query = `SELECT Start_Date__c, End_Date__c, Leave_Type__c, Leave_Status__c, Day_Type__c FROM Leave__c WHERE User = '${escapedUserId}' ORDER BY Start_Date__c DESC`;
        const res = await salesforceApi.query<LeaveSfRecord>(query);

        return res.records.map((record) => ({
            startDate: record.Start_Date__c,
            endDate: record.End_Date__c,
            type: record.Leave_Type__c,
            dayType: record.Day_Type__c,
            status: record.Leave_Status__c
        }));
    },

    async fetchAllHolidays(): Promise<HolidayRecord[]> {
        const query = 'SELECT Date__c, Name FROM Holiday__c WHERE Date__c = THIS_YEAR ORDER BY Date__c DESC';
        const res = await salesforceApi.query<HolidaySfRecord>(query);

        return res.records.map((record) => ({
            date: record.Date__c,
            name: record.Name
        }));
    },

    async fetchMonthlyData(year: number, month: number, accountId: string): Promise<{
        attendance: Record<string, AttendanceRecord>;
        holidays: Record<string, HolidayRecord>;
        leaves: Record<string, LeaveRecord[]>;
    }> {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const escapedAccountId = escapeSoqlLiteral(accountId);

        const attendanceQuery = `SELECT Id, Attendance_Date__c, Status__c, Work_Hours__c FROM Attendance__c WHERE Employee__c = '${escapedAccountId}' AND Attendance_Date__c >= ${startDate} AND Attendance_Date__c <= ${endDate}`;
        const attendanceRes = await salesforceApi.query<AttendanceMonthlyRecord>(attendanceQuery);

        const attendance: Record<string, AttendanceRecord> = {};
        const attendanceIds: string[] = [];

        attendanceRes.records.forEach((record) => {
            attendanceIds.push(record.Id);
            attendance[record.Attendance_Date__c] = {
                id: record.Id,
                date: record.Attendance_Date__c,
                status: record.Status__c,
                workHours: record.Work_Hours__c,
                hasRegularization: false
            };
        });

        if (attendanceIds.length > 0) {
            const idList = attendanceIds.map((id) => `'${escapeSoqlLiteral(id)}'`).join(',');
            const regularizationQuery = `SELECT AttendanceId__c FROM Regularization__c WHERE AttendanceId__c IN (${idList})`;
            const regularizationRes = await salesforceApi.query<RegularizationRecord>(regularizationQuery);
            const regularizedIds = new Set(regularizationRes.records.map((r) => r.AttendanceId__c));

            Object.values(attendance).forEach((record) => {
                if (regularizedIds.has(record.id)) {
                    record.hasRegularization = true;
                }
            });
        }

        const holidayQuery = `SELECT Date__c, Name FROM Holiday__c WHERE Date__c >= ${startDate} AND Date__c <= ${endDate}`;
        const holidayRes = await salesforceApi.query<HolidaySfRecord>(holidayQuery);
        const holidays: Record<string, HolidayRecord> = {};

        holidayRes.records.forEach((record) => {
            holidays[record.Date__c] = {
                date: record.Date__c,
                name: record.Name
            };
        });

        const leaveQuery = `SELECT Start_Date__c, End_Date__c, Leave_Type__c, Day_Type__c FROM Leave__c WHERE Start_Date__c <= ${endDate} AND End_Date__c >= ${startDate} AND Employee__c = '${escapedAccountId}'`;
        const leaveRes = await salesforceApi.query<LeaveSfRecord>(leaveQuery);
        const leaves: Record<string, LeaveRecord[]> = {};

        leaveRes.records.forEach((record) => {
            const start = new Date(record.Start_Date__c);
            const end = new Date(record.End_Date__c);
            const leaveRecord: LeaveRecord = {
                startDate: record.Start_Date__c,
                endDate: record.End_Date__c,
                type: record.Leave_Type__c,
                dayType: record.Day_Type__c
            };

            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const key = date.toISOString().split('T')[0];
                if (!leaves[key]) {
                    leaves[key] = [];
                }
                leaves[key].push(leaveRecord);
            }
        });

        return { attendance, holidays, leaves };
    }
};
