import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Platform, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface MainLayoutProps {
    children: React.ReactNode;
    title: string;
}


const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();

    const homeTabs = [
        { label: 'Overview', routeName: 'Home' as const },
        { label: 'Dashboard', routeName: 'Dashboard' as const },
    ];

    const attendanceTabs = [
        { label: 'Attendance', routeName: 'Attendance' as const },
        { label: 'Regularization', routeName: 'Regularization' as const },
    ];

    const projectTabs = [
        { label: 'Project', routeName: 'Project' as const },
        { label: 'Project Tasks', routeName: 'ProjectTasks' as const },
        { label: 'Time Log', routeName: 'TimeLog' as const },
    ];

    const leaveTabs = [
        { label: 'Leave', routeName: 'Leave' as const },
        { label: 'Holiday', routeName: 'Holiday' as const },
    ];

    const isHomeModule = route.name === 'Home' || route.name === 'Dashboard';
    const isAttendanceModule = route.name === 'Attendance' || route.name === 'Regularization';
    const isProjectModule = route.name === 'Project' || route.name === 'ProjectTasks' || route.name === 'TimeLog';
    const isLeaveModule = route.name === 'Leave' || route.name === 'Holiday';

    const currentTabs = isHomeModule ? homeTabs :
        isAttendanceModule ? attendanceTabs :
            isProjectModule ? projectTabs :
                isLeaveModule ? leaveTabs : [];

    return (
        <View style={styles.container}>
            <View style={styles.layoutBody}>
                {/* Desktop Sidebar - Spans full height of the app window */}
                {isDesktop && <Sidebar />}

                <View style={styles.mainColumn}>
                    {/* Header - Now moves into the right column */}
                    <Header />

                    {/* Sub-Header Area moved into mainColumn */}
                    <View style={styles.subHeader}>
                        <View style={styles.subHeaderContent}>
                            {/* Tabs for relevant modules - Aligned Left */}
                            {currentTabs.length > 0 && (
                                <View style={styles.tabsContainer}>
                                    {currentTabs.map((tab) => {
                                        const isActive = route.name === tab.routeName;
                                        return (
                                            <TouchableOpacity
                                                key={tab.routeName}
                                                style={[styles.tab, isActive && styles.activeTab]}
                                                onPress={() => navigation.navigate(tab.routeName)}
                                            >
                                                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                                    {tab.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.mainArea}>
                        <ScrollView
                            contentContainerStyle={[
                                styles.scrollContent,
                                route.name === 'Home' && { padding: 0 }
                            ]}
                        >
                            {children}
                        </ScrollView>

                        {!isDesktop && <BottomNav />}
                    </View>
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
    subHeader: {
        height: 50, // Reduced as title is gone
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },

    subHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: 30, // Increased gap for clarity
    },
    tab: {
        paddingVertical: 14,
        paddingHorizontal: 4,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#FF7A00',
    },
    tabText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FF7A00',
    },
    layoutBody: {
        flex: 1,
        flexDirection: 'row',
    },
    mainColumn: {
        flex: 1,
        flexDirection: 'column',
    },
    mainArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: Platform.OS === 'web' ? 24 : 100,
    },
});

export default MainLayout;
