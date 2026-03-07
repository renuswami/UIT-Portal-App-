import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendance.service';
import LeaveBalanceCard from './LeaveBalanceCard';

const LeaveBalanceGrid = () => {
    const { userEmail } = useAuth();
    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState({ sick: 0, casual: 0, optional: 0 });

    useEffect(() => {
        const loadBalances = async () => {
            if (!userEmail) return;
            try {
                const { accountId } = await attendanceService.getUserIdByEmail(userEmail);
                if (accountId) {
                    const bal = await attendanceService.fetchLeaveBalances(accountId);
                    setBalances(bal);
                }
            } catch (error) {
                console.error('[LeaveBalanceGrid] Error loading balances:', error);
            } finally {
                setLoading(false);
            }
        };
        loadBalances();
    }, [userEmail]);

    const handleApplyLeave = (type: string) => {
        Alert.alert('Apply Leave', `Navigating to Leave screen to apply for ${type}.`);
        // In a real app, we might use navigation.navigate('Leave', { initialType: type });
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="small" color="#002D52" />
            </View>
        );
    }

    const leaveData = [
        { type: 'Casual Leave', balance: balances.casual, color: '#4CAF50', icon: 'calendar-text-outline' },
        { type: 'Sick Leave', balance: balances.sick, color: '#FF9800', icon: 'hospital-box-outline' },
        { type: 'Optional Leave', balance: balances.optional, color: '#2196F3', icon: 'star-circle-outline' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Leave Balances</Text>
            <View style={styles.grid}>
                {leaveData.map((item) => (
                    <LeaveBalanceCard
                        key={item.type}
                        type={item.type}
                        balance={item.balance}
                        color={item.color}
                        icon={item.icon}
                        onApply={() => handleApplyLeave(item.type)}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1C1E',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
});

export default LeaveBalanceGrid;
