import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardCard from './DashboardCard';

const QuickActionsWidget = () => {
    const actions = [
        { label: 'Apply Leave', icon: 'calendar-plus', color: '#002D52' },
        { label: 'Log Time', icon: 'clock-plus-outline', color: '#FF7A00' },
        { label: 'Submit Expense', icon: 'receipt', color: '#4CAF50' },
        { label: 'Raise Request', icon: 'comment-question-outline', color: '#9C27B0' },
    ];

    return (
        <DashboardCard style={styles.container}>
            <Text style={styles.title}>Quick Actions</Text>
            <View style={styles.grid}>
                {actions.map((action) => (
                    <TouchableOpacity key={action.label} style={styles.actionItem}>
                        <View style={[styles.iconCircle, { backgroundColor: action.color + '10' }]}>
                            <MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />
                        </View>
                        <Text style={styles.actionLabel}>{action.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </DashboardCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    actionItem: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#444',
        textAlign: 'center',
    },
});

export default QuickActionsWidget;
