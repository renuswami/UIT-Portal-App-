import { storage } from '../utils/storage';
import { AppError } from '../utils/errors';

const AUTH_KEYS = {
    accessToken: 'sf_access_token',
    instanceUrl: 'sf_instance_url',
    userEmail: 'user_email',
    accountId: 'account_id'
};

interface SalesforceTokenResponse {
    access_token?: string;
    instance_url?: string;
    error?: string;
    error_description?: string;
}

interface SalesforceUserRecord {
    Username: string;
    Email: string;
    AccountId: string | null;
}

const escapeSoqlLiteral = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const getRequiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new AppError(`Missing environment variable: ${key}`, 'AUTH_CONFIGURATION_ERROR');
    }
    return value;
};


const buildLoginErrorMessage = (payload: SalesforceTokenResponse): string => {
    const description = payload.error_description?.toLowerCase() || '';

    if (description.includes('authentication failure') || description.includes('invalid_grant')) {
        return 'Invalid username or password. If your org requires a security token, append it to your password.';
    }

    if (payload.error_description) {
        return payload.error_description;
    }

    if (payload.error) {
        return payload.error;
    }

    return 'Invalid username or password';
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const accessToken = await storage.getItem(AUTH_KEYS.accessToken);
    if (!accessToken) {
        throw new AppError('Authentication token is missing. Please login again.', 'AUTH_TOKEN_MISSING');
    }

    return {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
    };
};

export const authService = {
    async login(username: string, password: string): Promise<{ accountId: string; username: string }> {
        const loginUrl = getRequiredEnv('EXPO_PUBLIC_SF_LOGIN_URL');
        const clientId = getRequiredEnv('EXPO_PUBLIC_SF_CLIENT_ID');
        const clientSecret = getRequiredEnv('EXPO_PUBLIC_SF_CLIENT_SECRET');

        const tokenRes = await fetch(`${loginUrl}/services/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'password',
                client_id: clientId,
                client_secret: clientSecret,
                username,
                password
            }).toString()
        });

        const tokenJson = await tokenRes.json() as SalesforceTokenResponse;
        if (!tokenRes.ok || !tokenJson.access_token || !tokenJson.instance_url) {
            throw new AppError(buildLoginErrorMessage(tokenJson), 'AUTH_LOGIN_FAILED');
        }

        await Promise.all([
            storage.setItem(AUTH_KEYS.accessToken, tokenJson.access_token),
            storage.setItem(AUTH_KEYS.instanceUrl, tokenJson.instance_url)
        ]);

        const escaped = escapeSoqlLiteral(username);
        const query = `SELECT Username, Email, AccountId FROM User WHERE Username = '${escaped}' OR Email = '${escaped}' ORDER BY LastLoginDate DESC LIMIT 1`;

        const response = await this.callApi(
            `${tokenJson.instance_url}/services/data/v60.0/query/?q=${encodeURIComponent(query)}`,
            { method: 'GET' }
        );
        const result = await response.json() as { records?: SalesforceUserRecord[] };

        const userRecord = result.records?.[0];
        if (!userRecord?.AccountId) {
            throw new AppError('No account mapped to this user.', 'AUTH_ACCOUNT_NOT_FOUND');
        }

        await Promise.all([
            storage.setItem(AUTH_KEYS.userEmail, userRecord.Email || username),
            storage.setItem(AUTH_KEYS.accountId, userRecord.AccountId)
        ]);

        return {
            accountId: userRecord.AccountId,
            username: userRecord.Email || userRecord.Username || username
        };
    },

    async getInstanceUrl(): Promise<string> {
        const instanceUrl = await storage.getItem(AUTH_KEYS.instanceUrl);
        if (!instanceUrl) {
            throw new AppError('Salesforce instance URL is missing. Please login again.', 'AUTH_INSTANCE_URL_MISSING');
        }
        return instanceUrl;
    },

    async callApi(url: string, init: RequestInit): Promise<Response> {
        const headers = await getAuthHeaders();
        return fetch(url, {
            ...init,
            headers: {
                ...headers,
                ...(init.headers || {})
            }
        });
    },

    async clearSession(): Promise<void> {
        await Promise.all([
            storage.deleteItem(AUTH_KEYS.accessToken),
            storage.deleteItem(AUTH_KEYS.instanceUrl),
            storage.deleteItem(AUTH_KEYS.userEmail),
            storage.deleteItem(AUTH_KEYS.accountId)
        ]);
    }
};
