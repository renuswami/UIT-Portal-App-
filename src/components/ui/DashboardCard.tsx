import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';

interface DashboardCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ children, style }) => {
    return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        ...Platform.select({
            web: {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 12,
                elevation: 2,
            }
        }),
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.03)',
    },
});

export default DashboardCard;
