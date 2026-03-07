import { authService } from '../services/auth.service';
import { AppError } from '../utils/errors';

interface SalesforceApiError {
    errorCode?: string;
    message?: string;
}

export interface SalesforceQueryResponse<TRecord> {
    totalSize: number;
    done: boolean;
    records: TRecord[];
}

const parseSalesforceError = (payload: unknown): string => {
    if (Array.isArray(payload) && payload.length > 0) {
        const first = payload[0] as SalesforceApiError;
        return first.message || first.errorCode || 'Salesforce request failed';
    }

    if (payload && typeof payload === 'object') {
        const maybe = payload as SalesforceApiError;
        return maybe.message || maybe.errorCode || 'Salesforce request failed';
    }

    return 'Salesforce request failed';
};

/**
 * Low-level service for interacting with Salesforce REST API
 */
export const salesforceApi = {
    async query<TRecord>(soql: string): Promise<SalesforceQueryResponse<TRecord>> {
        const instanceUrl = await authService.getInstanceUrl();
        const url = `${instanceUrl}/services/data/v60.0/query/?q=${encodeURIComponent(soql)}`;

        const response = await authService.callApi(url, { method: 'GET' });
        const data = await response.json();

        if (!response.ok) {
            throw new AppError(parseSalesforceError(data), 'SF_QUERY_FAILED', data);
        }

        return data as SalesforceQueryResponse<TRecord>;
    },

    async create<TPayload extends object>(sobject: string, payload: TPayload): Promise<{ id: string; success: boolean; errors: string[] }> {
        const instanceUrl = await authService.getInstanceUrl();
        const url = `${instanceUrl}/services/data/v60.0/sobjects/${sobject}`;

        const response = await authService.callApi(url, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new AppError(parseSalesforceError(data), 'SF_CREATE_FAILED', data);
        }

        return data as { id: string; success: boolean; errors: string[] };
    },

    async update<TPayload extends object>(sobject: string, id: string, payload: TPayload): Promise<void> {
        const instanceUrl = await authService.getInstanceUrl();
        const url = `${instanceUrl}/services/data/v60.0/sobjects/${sobject}/${id}`;

        const response = await authService.callApi(url, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new AppError(parseSalesforceError(data), 'SF_UPDATE_FAILED', data);
        }
    },

    async uploadContentVersion(data: { Title: string; PathOnClient: string; VersionData: string; FirstPublishLocationId: string }): Promise<void> {
        const instanceUrl = await authService.getInstanceUrl();
        const url = `${instanceUrl}/services/data/v60.0/sobjects/ContentVersion`;

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
            throw new AppError(parseSalesforceError(result), 'SF_UPLOAD_FAILED', result);
        }
    }
};
