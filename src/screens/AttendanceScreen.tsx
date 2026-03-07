import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { attendanceQueryService, AttendanceRecord, HolidayRecord, LeaveRecord } from '../services/attendanceQuery.service';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const AttendanceScreen = () => {
    const { userEmail, accountId } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        attendance: Record<string, AttendanceRecord>;
        holidays: Record<string, HolidayRecord>;
        leaves: Record<string, LeaveRecord[]>;
    }>({ attendance: {}, holidays: {}, leaves: {} });

    const [balances, setBalances] = useState({ sick: 0, casual: 0, optional: 0 });
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [currentDate, accountId]);

    const fetchData = async (isRefreshing = false) => {
        if (!accountId) return;
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            // Parallel fetch for data and balances
            const [result, balanceData] = await Promise.all([
                attendanceQueryService.fetchMonthlyData(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    accountId
                ),
                attendanceQueryService.fetchLeaveBalances(accountId)
            ]);

            setData(result);
            setBalances(balanceData);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchData(true);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.navSection}>
                <View style={styles.navControls}>
                    <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
                        <MaterialCommunityIcons name="chevron-left" size={24} color="#002D52" />
                    </TouchableOpacity>
                    <View style={styles.calendarIconContainer}>
                        <MaterialCommunityIcons name="calendar-month" size={20} color="#9C27B0" />
                    </View>
                    <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#002D52" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.monthTitle}>
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
            </View>

            <View style={styles.balanceSection}>
                <View style={styles.balanceBadge}>
                    <MaterialCommunityIcons name="account" size={16} color="#002D52" />
                    <Text style={styles.balanceLabel}>Sick Leave Balance:</Text>
                    <Text style={styles.balanceValue}>{balances.sick}</Text>
                </View>
                <View style={styles.balanceBadge}>
                    <MaterialCommunityIcons name="account" size={16} color="#002D52" />
                    <Text style={styles.balanceLabel}>Casual Leave Balance:</Text>
                    <Text style={styles.balanceValue}>{balances.casual}</Text>
                </View>
                <View style={styles.balanceBadge}>
                    <MaterialCommunityIcons name="account" size={16} color="#002D52" />
                    <Text style={styles.balanceLabel}>Optional Leave Balance:</Text>
                    <Text style={styles.balanceValue}>{balances.optional}</Text>
                </View>
            </View>
        </View>
    );

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const cells = [];

        // Previous month padding
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            cells.push({ day: daysInPrevMonth - i, currentMonth: false });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            cells.push({ day: i, currentMonth: true });
        }

        // Next month padding
        const remaining = 42 - cells.length; // 6 rows
        for (let i = 1; i <= remaining; i++) {
            cells.push({ day: i, currentMonth: false });
        }

        return (
            <View style={styles.calendarGrid}>
                <View style={styles.weekHeader}>
                    {DAYS.map(day => (
                        <View key={day} style={styles.weekDayCell}>
                            <Text style={styles.weekDayText}>{day}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.cellsContainer}>
                    {cells.map((cell, index) => {
                        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                        const cellDate = new Date(year, month, cell.day);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isFuture = cellDate > today;
                        const isSunday = index % 7 === 0;

                        const att = cell.currentMonth ? data.attendance[dateString] : null;
                        const holiday = cell.currentMonth ? data.holidays[dateString] : null;
                        const leavesForDay: LeaveRecord[] = cell.currentMonth ? (data.leaves[dateString] || []) : [];

                        return (
                            <View key={index} style={[
                                styles.cell,
                                !cell.currentMonth && styles.inactiveCell,
                                isSunday && styles.sundayCell
                            ]}>
                                <View style={styles.cellHeader}>
                                    <Text style={styles.dateText}>{cell.day}</Text>
                                    {att && att.hasRegularization && (
                                        <MaterialCommunityIcons name="check-bold" size={14} color="#4CAF50" />
                                    )}
                                </View>
                                <View style={styles.statusContainer}>
                                    {!isSunday && (
                                        <>
                                            {holiday ? (
                                                <LinearGradient
                                                    colors={['#fb6b39', '#fa67cd']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={[styles.statusLabel, styles.holidayLabel]}
                                                >
                                                    <Text style={styles.holidayText} numberOfLines={1}>{holiday.name}</Text>
                                                </LinearGradient>
                                            ) : (
                                                <>
                                                    {leavesForDay.map((leave, leaveIdx) => {
                                                        const isUnpaid = leave.type?.toLowerCase().includes('unpaid');
                                                        if (isUnpaid) {
                                                            return (
                                                                <View key={leaveIdx} style={[styles.statusLabel, styles.absentLabel]}>
                                                                    <Text style={styles.absentText} numberOfLines={1}>{leave.type}</Text>
                                                                </View>
                                                            );
                                                        }
                                                        return (
                                                            <LinearGradient
                                                                key={leaveIdx}
                                                                colors={['#508ff6', '#a2c3fa']}
                                                                start={{ x: 0, y: 0 }}
                                                                end={{ x: 1, y: 0 }}
                                                                style={[styles.statusLabel, styles.sickLeaveLabel]}
                                                            >
                                                                <Text style={styles.sickLeaveText} numberOfLines={1}>
                                                                    {leave.type}{leave.dayType ? ` - ${leave.dayType}` : ''}
                                                                </Text>
                                                            </LinearGradient>
                                                        );
                                                    })}
                                                    {att && att.status?.toLowerCase().includes('present') && (
                                                        <View style={[styles.statusLabel, styles.presentLabel]}>
                                                            <Text style={styles.presentTitle}>
                                                                {att.status?.toLowerCase().includes('half') ? 'Present (Half Day)' : 'Present'}
                                                            </Text>
                                                            <Text style={styles.workHoursText}>{att.workHours || '0h 0m'}</Text>
                                                        </View>
                                                    )}
                                                    {cell.currentMonth && !isFuture && !holiday && leavesForDay.length === 0 && (!att || !att.status?.toLowerCase().includes('present')) && (
                                                        <View style={[styles.statusLabel, styles.absentLabel]}>
                                                            <Text style={styles.absentText}>Absent</Text>
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <MainLayout title="Attendance">
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {renderHeader()}
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#002D52" />
                    </View>
                ) : (
                    renderCalendar()
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        flexWrap: 'wrap',
        gap: 12,
    },
    navSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    navControls: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        padding: 2,
    },
    navButton: {
        padding: 4,
    },
    calendarIconContainer: {
        paddingHorizontal: 8,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#E0E0E0',
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1C1E',
    },
    balanceSection: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    balanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 6,
    },
    balanceLabel: {
        fontSize: 12,
        color: '#002D52',
        fontWeight: '500',
    },
    balanceValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#002D52',
    },
    calendarGrid: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    weekHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    weekDayCell: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    cellsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        width: '14.28%',
        height: 120,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E0E0E0',
        padding: 6,
    },
    inactiveCell: {
        backgroundColor: '#FCFCFC',
    },
    sundayCell: {
        backgroundColor: '#fffef1ff',
    },
    cellHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    dateText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    statusContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        gap: 4,
    },
    statusLabel: {
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    presentLabel: {
        backgroundColor: '#E8F5E9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    presentTitle: {
        fontSize: 10,
        color: '#2E7D32',
        fontWeight: '600',
    },
    workHoursText: {
        fontSize: 10,
        color: '#2E7D32',
        opacity: 0.8,
    },
    holidayLabel: {
        overflow: 'hidden',
    },
    holidayText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    leaveLabel: {
        backgroundColor: '#FCE4EC',
    },
    leaveText: {
        fontSize: 10,
        color: '#C2185B',
        fontWeight: '600',
    },
    sickLeaveLabel: {
        overflow: 'hidden',
    },
    sickLeaveText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    absentLabel: {
        backgroundColor: '#FFEBEE',
    },
    absentText: {
        fontSize: 10,
        color: '#D32F2F',
        fontWeight: '600',
    },
    loaderContainer: {
        padding: 100,
        alignItems: 'center',
    }
});

export default AttendanceScreen;
