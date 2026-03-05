import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Robust storage helper that handles SecureStore and fallbacks to AsyncStorage
 * (Common for web or environments where SecureStore native module is missing)
 */
export const storage = {
    async getItem(key: string): Promise<string | null> {
        try {
            if (Platform.OS !== 'web' && await SecureStore.isAvailableAsync()) {
                return await SecureStore.getItemAsync(key);
            }
        } catch (e) {
            console.warn(`SecureStore getItem failed for ${key}, falling back to AsyncStorage`, e);
        }
        return await AsyncStorage.getItem(key);
    },
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Platform.OS !== 'web' && await SecureStore.isAvailableAsync()) {
                await SecureStore.setItemAsync(key, value);
                return;
            }
        } catch (e) {
            console.warn(`SecureStore setItem failed for ${key}, falling back to AsyncStorage`, e);
        }
        await AsyncStorage.setItem(key, value);
    },
    async deleteItem(key: string): Promise<void> {
        try {
            if (Platform.OS !== 'web' && await SecureStore.isAvailableAsync()) {
                await SecureStore.deleteItemAsync(key);
                return;
            }
        } catch (e) {
            // Ignore error on delete
        }
        await AsyncStorage.removeItem(key);
    }
};
