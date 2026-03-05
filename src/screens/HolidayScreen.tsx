import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { attendanceService, HolidayRecord } from '../services/attendance.service';

const HolidayScreen = () => {
    const { userEmail } = useAuth();
    const [loading, setLoading] = useState(true);
    const [holidays, setHolidays] = useState<HolidayRecord[]>([]);

    useEffect(() => {
        fetchData();
    }, [userEmail]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const holidayData = await attendanceService.fetchAllHolidays();
            setHolidays(holidayData);
        } catch (error) {
            console.error('[HolidayScreen] Error fetching holidays:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout title="Leave Management">
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#002D52" />
                    </View>
                ) : (
                    <View style={styles.tabContent}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Company Holidays</Text>
                        </View>
                        {holidays.length === 0 ? (
                            <Text style={styles.emptyText}>No holidays found.</Text>
                        ) : (
                            holidays.map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <View style={[styles.listIcon, { backgroundColor: '#FCE4EC' }]}>
                                        <MaterialCommunityIcons name="star" size={20} color="#C2185B" />
                                    </View>
                                    <View style={styles.listContent}>
                                        <Text style={styles.itemTitle}>{item.name}</Text>
                                        <Text style={styles.itemSubtitle}>{item.date}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
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

export default HolidayScreen;
