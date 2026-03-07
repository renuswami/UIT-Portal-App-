import { salesforceApi } from '../../api/salesforce.api';
import { AppError, getErrorMessage } from '../../utils/errors';

interface ContactRecord {
    Id: string;
}

interface WorkSessionRecord {
    Id: string;
    Check_In__c: string;
}

interface AttendanceIdRecord {
    Id: string;
}

const escapeSoqlLiteral = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * Service to orchestrate Check-In and Check-Out business processes
 */
export const attendanceSessionService = {
    async validateEmail(email: string): Promise<boolean> {
        try {
            const escapedEmail = escapeSoqlLiteral(email);
            const data = await salesforceApi.query<ContactRecord>(
                `SELECT Id FROM Contact WHERE Email = '${escapedEmail}' LIMIT 1`
            );
            return data.totalSize > 0;
        } catch (error) {
            throw new AppError(getErrorMessage(error, 'Email validation failed'), 'SF_EMAIL_VALIDATE_FAILED', error);
        }
    },

    async getActiveWorkSession(accountId: string): Promise<{ id: string; checkInTime: string } | null> {
        try {
            const escapedAccountId = escapeSoqlLiteral(accountId);
            const data = await salesforceApi.query<WorkSessionRecord>(
                `SELECT Id, Check_In__c FROM Work_Session__c 
                 WHERE Account__c = '${escapedAccountId}' 
                 AND Attendance__r.Date__c = TODAY 
                 AND Status__c = 'Checked In' 
                 ORDER BY CreatedDate DESC LIMIT 1`
            );

            if (data.totalSize > 0) {
                const record = data.records[0];
                return {
                    id: record.Id,
                    checkInTime: record.Check_In__c
                };
            }

            return null;
        } catch (error) {
            throw new AppError(getErrorMessage(error, 'Failed to resolve active work session'), 'SF_SESSION_DISCOVERY_FAILED', error);
        }
    },

    async getOrCreateTodayAttendance(accountId: string): Promise<string> {
        const todayStr = new Date().toISOString().split('T')[0];
        const uniqueKey = `${accountId}_${todayStr}`;
        const escapedAccountId = escapeSoqlLiteral(accountId);

        const existing = await salesforceApi.query<AttendanceIdRecord>(
            `SELECT Id FROM Attendance__c WHERE Employee__c = '${escapedAccountId}' AND Date__c = TODAY LIMIT 1`
        );

        if (existing.totalSize > 0) {
            return existing.records[0].Id;
        }

        const result = await salesforceApi.create('Attendance__c', {
            Employee__c: accountId,
            Date__c: todayStr,
            Unique_Key__c: uniqueKey
        });

        return result.id;
    },

    async checkIn(accountId: string, base64Image: string): Promise<string> {
        const attendanceId = await this.getOrCreateTodayAttendance(accountId);

        const session = await salesforceApi.create('Work_Session__c', {
            Account__c: accountId,
            Attendance__c: attendanceId,
            Check_In__c: new Date().toISOString(),
            Status__c: 'Checked In'
        });

        const timestamp = Date.now();
        await salesforceApi.uploadContentVersion({
            Title: `Check-In_Selfie_${timestamp}`,
            PathOnClient: `checkin_${timestamp}.jpg`,
            VersionData: base64Image,
            FirstPublishLocationId: session.id
        });

        return session.id;
    },

    async checkOut(sessionId: string, base64Image: string): Promise<void> {
        await salesforceApi.update('Work_Session__c', sessionId, {
            Check_Out__c: new Date().toISOString(),
            Status__c: 'Checked Out'
        });

        const timestamp = Date.now();
        await salesforceApi.uploadContentVersion({
            Title: `Check-Out_Selfie_${timestamp}`,
            PathOnClient: `checkout_${timestamp}.jpg`,
            VersionData: base64Image,
            FirstPublishLocationId: sessionId
        });
    }
};
