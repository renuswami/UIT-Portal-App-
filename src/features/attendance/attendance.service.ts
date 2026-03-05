import { salesforceApi } from '../../api/salesforce.api';

export interface AttendanceIdentifiers {
    contactId: string;
    accountId: string;
    userId: string;
}

/**
 * Service to orchestrate Check-In and Check-Out business processes
 */
export const attendanceService = {
    /**
     * Validates if a contact exists for the email
     */
    async validateEmail(email: string): Promise<boolean> {
        try {
            const data = await salesforceApi.query(
                `SELECT Id FROM Contact WHERE Email = '${email}' LIMIT 1`
            );
            return data.totalSize > 0;
        } catch (error) {
            console.error('[AttendanceService] Email validation error:', error);
            return false;
        }
    },

    /**
     * Gets the active 'Checked In' session for today
     */
    async getActiveWorkSession(email: string): Promise<{ id: string; checkInTime: string } | null> {
        console.log(`[AttendanceService] Checking for active session: ${email}`);
        try {
            const data = await salesforceApi.query(
                `SELECT Id, Check_In__c FROM Work_Session__c 
                 WHERE User__r.Email = '${email}' 
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
            console.error('[AttendanceService] Session discovery error:', error);
            return null;
        }
    },

    /**
     * Finds Salesforce identifiers for a given email
     */
    async getIdentifiers(email: string): Promise<AttendanceIdentifiers> {
        console.log(`[AttendanceService] Fetching identifiers for: ${email}`);

        // 1. Get Contact and Account
        const contactData = await salesforceApi.query(
            `SELECT Id, AccountId FROM Contact WHERE Email = '${email}' LIMIT 1`
        );

        if (contactData.totalSize === 0) {
            throw new Error(`No Contact found for email: ${email}`);
        }

        const contactId = contactData.records[0].Id;
        const accountId = contactData.records[0].AccountId;

        // 2. Get User ID
        const userData = await salesforceApi.query(
            `SELECT Id FROM User WHERE Email = '${email}' LIMIT 1`
        );

        if (userData.totalSize === 0) {
            throw new Error(`No User found for email: ${email}`);
        }

        const userId = userData.records[0].Id;
        return { contactId, accountId, userId };
    },

    /**
     * Finds or creates today's Attendance record
     */
    async getOrCreateTodayAttendance(userId: string, accountId: string): Promise<string> {
        const todayStr = new Date().toISOString().split('T')[0];
        const uniqueKey = `${userId}_${todayStr}`;

        // Check existing
        const existing = await salesforceApi.query(
            `SELECT Id FROM Attendance__c WHERE User__c = '${userId}' AND Date__c = TODAY LIMIT 1`
        );

        if (existing.totalSize > 0) {
            return existing.records[0].Id;
        }

        // Create new
        const result = await salesforceApi.create('Attendance__c', {
            Employee__c: accountId,
            User__c: userId,
            Date__c: todayStr,
            Unique_Key__c: uniqueKey
        });

        return result.id;
    },

    /**
     * Performs a full Check-In flow
     */
    async checkIn(email: string, base64Image: string): Promise<string> {
        const ids = await this.getIdentifiers(email);
        const attendanceId = await this.getOrCreateTodayAttendance(ids.userId, ids.accountId);

        // Create Work Session
        const session = await salesforceApi.create('Work_Session__c', {
            User__c: ids.userId,
            Account__c: ids.accountId,
            Attendance__c: attendanceId,
            Check_In__c: new Date().toISOString(),
            Status__c: 'Checked In'
        });

        // Upload image
        const timestamp = new Date().getTime();
        await salesforceApi.uploadContentVersion({
            Title: `Check-In_Selfie_${timestamp}`,
            PathOnClient: `checkin_${timestamp}.jpg`,
            VersionData: base64Image,
            FirstPublishLocationId: session.id
        });

        return session.id;
    },

    /**
     * Performs a full Check-Out flow
     */
    async checkOut(sessionId: string, base64Image: string): Promise<void> {
        // Update Session
        await salesforceApi.update('Work_Session__c', sessionId, {
            Check_Out__c: new Date().toISOString(),
            Status__c: 'Checked Out'
        });

        // Upload image
        const timestamp = new Date().getTime();
        await salesforceApi.uploadContentVersion({
            Title: `Check-Out_Selfie_${timestamp}`,
            PathOnClient: `checkout_${timestamp}.jpg`,
            VersionData: base64Image,
            FirstPublishLocationId: sessionId
        });
    }
};
