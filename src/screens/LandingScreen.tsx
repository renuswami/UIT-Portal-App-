import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Platform, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import ProfileSummary from '../components/ui/ProfileSummary';
import GreetingCard from '../components/ui/GreetingCard';
import CheckInWidget from '../components/ui/CheckInWidget';
import DashboardCard from '../components/ui/DashboardCard';
import LeaveBalanceWidget from '../components/ui/LeaveBalanceWidget';
import NotificationsWidget from '../components/ui/NotificationsWidget';
import QuickActionsWidget from '../components/ui/QuickActionsWidget';

const LandingScreen = () => {
    const { userEmail } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;

    const userName = userEmail?.split('@')[0] || 'User';

    return (
        <View style={styles.container}>
            {/* Layout wrapper */}
            <View style={styles.contentWrapper}>
                {/* Desktop Sidebar */}
                {isDesktop && <Sidebar />}

                {/* Main Content Area */}
                <View style={styles.mainArea}>
                    <Header />

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* Tab Navigation Placeholder (Mobile) */}
                        {!isDesktop && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileTabs}>
                                {['Overview', 'Activities', 'Leaves', 'Files'].map((t) => (
                                    <View key={t} style={[styles.mobileTab, t === 'Overview' && styles.activeMobileTab]}>
                                        <Text style={[styles.mobileTabText, t === 'Overview' && styles.activeMobileTabText]}>{t}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

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
                    </ScrollView>

                    {/* Mobile Bottom Navigation */}
                    {!isDesktop && <BottomNav />}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6F9',
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'row',
    },
    mainArea: {
        flex: 1,
        height: '100%',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: Platform.OS === 'web' ? 24 : 100, // Add padding for bottom nav on mobile
    },
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
    mobileTabs: {
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    mobileTab: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginRight: 10,
    },
    activeMobileTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#002D52',
    },
    mobileTabText: {
        color: '#666',
        fontSize: 14,
    },
    activeMobileTabText: {
        color: '#002D52',
        fontWeight: 'bold',
    },
});

export default LandingScreen;

