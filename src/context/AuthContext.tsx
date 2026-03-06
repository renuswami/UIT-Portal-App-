import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authService } from '../services/auth.service';

interface AuthContextType {
    isLoggedIn: boolean;
    userEmail: string | null;
    accountId: string | null;
    login: (username: string, accountId: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const [storedEmail, storedAccountId] = await Promise.all([
                    storage.getItem('user_email'),
                    storage.getItem('account_id')
                ]);
                if (storedEmail) {
                    setIsLoggedIn(true);
                    setUserEmail(storedEmail);
                    setAccountId(storedAccountId);
                }
            } catch (e) {
                console.error('Failed to load session:', e);
            } finally {
                setIsLoading(false);
            }
        };
        checkLogin();
    }, []);

    const login = async (username: string, accId: string) => {
        await Promise.all([
            storage.setItem('user_email', username),
            storage.setItem('account_id', accId)
        ]);
        setUserEmail(username);
        setAccountId(accId);
        setIsLoggedIn(true);
    };

    const logout = async () => {
        await authService.clearSession();
        setUserEmail(null);
        setAccountId(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, userEmail, accountId, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
