import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { attendanceService, LeaveRecord } from '../services/attendance.service';

const LeaveScreen = () => {
    const { userEmail } = useAuth();
    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState({ sick: 0, casual: 0, optional: 0 });
    const [leaves, setLeaves] = useState<LeaveRecord[]>([]);

    useEffect(() => {
        fetchData();
    }, [userEmail]);

    const fetchData = async () => {
        if (!userEmail) return;
        setLoading(true);
        try {
            const { userId, accountId } = await attendanceService.getUserIdByEmail(userEmail);

            const [balanceData, leaveData] = await Promise.all([
                accountId ? attendanceService.fetchLeaveBalances(accountId) : Promise.resolve({ sick: 0, casual: 0, optional: 0 }),
                attendanceService.fetchAllLeaves(userId)
            ]);

            setBalances(balanceData);
            setLeaves(leaveData);
        } catch (error) {
            console.error('[LeaveScreen] Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderLeaveTab = () => (
        <View style={styles.tabContent}>
            {/* Leave Balances */}
            <View style={styles.balanceSection}>
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceValue}>{balances.sick}</Text>
                    <Text style={styles.balanceLabel}>Sick Leave</Text>
                </View>
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceValue}>{balances.casual}</Text>
                    <Text style={styles.balanceLabel}>Casual Leave</Text>
                </View>
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceValue}>{balances.optional}</Text>
                    <Text style={styles.balanceLabel}>Optional Leave</Text>
                </View>
            </View>

            {/* Leave History */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Leave History</Text>
            </View>
            {leaves.length === 0 ? (
                <Text style={styles.emptyText}>No leave history found.</Text>
            ) : (
                leaves.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                        <View style={styles.listIcon}>
                            <MaterialCommunityIcons name="calendar-clock" size={20} color="#002D52" />
                        </View>
                        <View style={styles.listContent}>
                            <Text style={styles.itemTitle}>{item.type} Leave</Text>
                            <Text style={styles.itemSubtitle}>{item.startDate} to {item.endDate}</Text>
                        </View>
                        <View style={[styles.statusBadge, item.status === 'Approved' ? styles.approvedBadge : styles.pendingBadge]}>
                            <Text style={[styles.statusText, item.status === 'Approved' ? styles.approvedText : styles.pendingText]}>
                                {item.status || 'Pending'}
                            </Text>
                        </View>
                    </View>
                ))
            )}
        </View>
    );

    return (
        <MainLayout title="Leave Management">
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#002D52" />
                    </View>
                ) : (
                    renderLeaveTab()
                )}
            </ScrollView>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    contentContainer: {
        padding: 16,
    },
    tabContent: {
        width: '100%',
        maxWidth: 1000,
        alignSelf: 'center',
    },
    balanceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    balanceCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 1,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#002D52',
        marginBottom: 4,
    },
    balanceLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    listIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listContent: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1C1E',
    },
    itemSubtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    approvedBadge: {
        backgroundColor: '#E8F5E9',
    },
    pendingBadge: {
        backgroundColor: '#FFF3E0',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    approvedText: {
        color: '#2E7D32',
    },
    pendingText: {
        color: '#E65100',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 40,
        fontSize: 14,
    },
    loaderContainer: {
        paddingTop: 100,
        alignItems: 'center',
    }
});

export default LeaveScreen;
