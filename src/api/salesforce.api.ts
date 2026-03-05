import { authService } from '../services/auth.service';

/**
 * Low-level service for interacting with Salesforce REST API
 */
export const salesforceApi = {
    async query(soql: string): Promise<any> {
        const instanceUrl = await authService.getInstanceUrl();
        const url = `${instanceUrl}/services/data/v60.0/query/?q=${encodeURIComponent(soql)}`;

        console.log(`[SFApi] QUERY: ${url}`);
        const response = await authService.callApi(url, { method: 'GET' });

        const data = await response.json();
        if (!response.ok) {
            const err = Array.isArray(data) ? data[0] : data;
            console.error(`[SFApi] Query Failed: ${err.errorCode} - ${err.message}`);
            throw new Error(err.message || 'Salesforce Query Failed');
        }
        return data;
    },

    async create(sobject: string, data: any): Promise<any> {
        const instanceUrl = await authService.getInstanceUrl();
        const url = `${instanceUrl}/services/data/v60.0/sobjects/${sobject}`;

        console.log(`[SFApi] CREATE ${sobject}: ${url}`);
        const response = await authService.callApi(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (!response.ok) {
            console.error(`[SFApi] Create ${sobject} Failed:`, JSON.stringify(result, null, 2));
            throw new Error(result[0]?.message || `Failed to create ${sobject}`);
        }
        return result;
    },

    async update(sobject: string, id: string, data: any): Promise<void> {
        const instanceUrl = await authService.getInstanceUrl();
        const url = `${instanceUrl}/services/data/v60.0/sobjects/${sobject}/${id}`;

        console.log(`[SFApi] UPDATE ${sobject} ${id}: ${url}`);
        const response = await authService.callApi(url, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const result = await response.json();
            console.error(`[SFApi] Update ${sobject} Failed:`, JSON.stringify(result, null, 2));
            throw new Error(result[0]?.message || `Failed to update ${sobject}`);
        }
    },

    async uploadContentVersion(data: { Title: string; PathOnClient: string; VersionData: string; FirstPublishLocationId: string }): Promise<void> {
        const instanceUrl = await authService.getInstanceUrl();
        const url = `${instanceUrl}/services/data/v60.0/sobjects/ContentVersion`;

        console.log(`[SFApi] UPLOAD ContentVersion to: ${data.FirstPublishLocationId}`);

        // Salesforce ContentVersion.VersionData expects raw base64 without headers
        const cleanedVersionData = data.VersionData.replace(/^data:image\/\w+;base64,/, '');

        const response = await authService.callApi(url, {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                VersionData: cleanedVersionData
            })
        });

        if (!response.ok) {
            const result = await response.json();
            console.error('[SFApi] Upload Failed:', result);
            throw new Error(result[0]?.message || 'File upload failed');
        }
    }
};
