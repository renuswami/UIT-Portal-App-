import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardCard from './DashboardCard';

const LeaveBalanceWidget = () => {
    const balances = [
        { label: 'Annual Leave', value: 14, color: '#002D52', icon: 'calendar-check' },
        { label: 'Sick Leave', value: 8, color: '#FF7A00', icon: 'emoticon-sick-outline' },
        { label: 'Optional Leave', value: 5, color: '#4CAF50', icon: 'star-outline' },
    ];

    return (
        <DashboardCard style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Leave Balances</Text>
                <MaterialCommunityIcons name="information-outline" size={18} color="#999" />
            </View>

            <View style={styles.balanceGrid}>
                {balances.map((item, index) => (
                    <View key={item.label} style={[styles.balanceItem, index !== balances.length - 1 && styles.borderBottom]}>
                        <View style={styles.labelSection}>
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                                <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                            </View>
                            <Text style={styles.label}>{item.label}</Text>
                        </View>
                        <View style={styles.valueSection}>
                            <Text style={[styles.value, { color: item.color }]}>{item.value.toString().padStart(2, '0')}</Text>
                            <Text style={styles.days}>Days</Text>
                        </View>
                    </View>
                ))}
            </View>
        </DashboardCard>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    balanceGrid: {
        gap: 0,
    },
    balanceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    labelSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    valueSection: {
        alignItems: 'flex-end',
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    days: {
        fontSize: 10,
        color: '#999',
        fontWeight: '600',
    },
});

export default LeaveBalanceWidget;
