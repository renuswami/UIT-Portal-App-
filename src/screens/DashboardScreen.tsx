import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import ProfileSummary from '../components/ui/ProfileSummary';
import GreetingCard from '../components/ui/GreetingCard';
import CheckInWidget from '../components/ui/CheckInWidget';
import LeaveBalanceWidget from '../components/ui/LeaveBalanceWidget';
import NotificationsWidget from '../components/ui/NotificationsWidget';
import QuickActionsWidget from '../components/ui/QuickActionsWidget';

const DashboardScreen = () => {
    const { userEmail } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const userName = userEmail?.split('@')[0] || 'User';

    return (
        <MainLayout title="Dashboard">
            <View style={styles.dashboardGrid}>
                {/* Row 1: Greeting & Profile */}
                <View style={[styles.row, !isDesktop && styles.stackRow]}>
                    <GreetingCard name={userName} />
                    <ProfileSummary name={userName} email={userEmail || ''} />
                </View>

                {/* Row 2: Main Dashboard Content */}
                <View style={[styles.row, !isDesktop && styles.stackRow]}>
                    {/* Left Column: Attendance & Quick Actions */}
                    <View style={[styles.column, { flex: 1.5 }]}>
                        <CheckInWidget />
                        <QuickActionsWidget />
                    </View>

                    {/* Right Column: Leave Balance & Notifications */}
                    <View style={[styles.column, { flex: 1 }]}>
                        <LeaveBalanceWidget />
                        <NotificationsWidget />
                    </View>
                </View>
            </View>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    dashboardGrid: {
        maxWidth: 1240,
        alignSelf: 'center',
        width: '100%',
        gap: 24,
    },
    row: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 24,
    },
    column: {
        flex: 1,
        gap: 24,
    },
    stackRow: {
        flexDirection: 'column',
        gap: 24,
        marginBottom: 24,
    },
});

export default DashboardScreen;
