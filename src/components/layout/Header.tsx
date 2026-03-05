import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const HeaderLogoutButton = () => {
    const { logout } = useAuth();
    return (
        <TouchableOpacity style={styles.iconButton} onPress={logout}>
            <MaterialCommunityIcons name="logout" size={22} color="#FF3B30" />
        </TouchableOpacity>
    );
};

const Header = () => {
    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                <View style={styles.left}>
                    {/* Logo removed - Moved to Sidebar */}
                </View>

                <View style={styles.right}>
                    <TouchableOpacity style={styles.iconButton}>
                        <MaterialCommunityIcons name="bell-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => { }}>
                        <MaterialCommunityIcons name="account-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <HeaderLogoutButton />
                </View>
            </View>
            <LinearGradient
                colors={['#FF7A00', '#FF7A00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientLine}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: '#0f1a51',
        zIndex: 20,
    },
    container: {
        height: 57, // Slimmer height
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconButton: {
        padding: 6,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientLine: {
        height: 2.5,
        width: '100%',
    },
});

export default Header;
