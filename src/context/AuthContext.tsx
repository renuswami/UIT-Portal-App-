import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils/storage';
import { authService } from '../services/auth.service';

interface AuthContextType {
    isLoggedIn: boolean;
    userEmail: string | null;
    login: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const storedEmail = await storage.getItem('user_email');
                if (storedEmail) {
                    setIsLoggedIn(true);
                    setUserEmail(storedEmail);
                }
            } catch (e) {
                console.error('Failed to load session:', e);
            } finally {
                setIsLoading(false);
            }
        };
        checkLogin();
    }, []);

    const login = async (email: string) => {
        await storage.setItem('user_email', email);
        setUserEmail(email);
        setIsLoggedIn(true);
    };

    const logout = async () => {
        await authService.clearSession();
        setUserEmail(null);
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, userEmail, login, logout, isLoading }}>
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
