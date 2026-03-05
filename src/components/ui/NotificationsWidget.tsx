import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardCard from './DashboardCard';

const NotificationsWidget = () => {
    const notifications = [
        {
            id: '1',
            text: 'Leave request approved for Mar 1st',
            time: '2h ago',
            icon: 'calendar-check',
            color: '#4CAF50'
        },
        {
            id: '2',
            text: 'Task "Quarterly Report" completed',
            time: '5h ago',
            icon: 'checkbox-marked-circle',
            color: '#002D52'
        },
        {
            id: '3',
            text: 'New policy update available in Files',
            time: '1d ago',
            icon: 'file-document-outline',
            color: '#FF7A00'
        },
    ];

    return (
        <DashboardCard style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Recent Notifications</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.list}>
                {notifications.map((n) => (
                    <View key={n.id} style={styles.notifItem}>
                        <View style={[styles.iconContainer, { backgroundColor: n.color + '10' }]}>
                            <MaterialCommunityIcons name={n.icon as any} size={18} color={n.color} />
                        </View>
                        <View style={styles.textContent}>
                            <Text style={styles.notifText}>{n.text}</Text>
                            <Text style={styles.notifTime}>{n.time}</Text>
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
    viewAll: {
        fontSize: 12,
        color: '#002D52',
        fontWeight: '600',
    },
    list: {
        gap: 16,
    },
    notifItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContent: {
        flex: 1,
    },
    notifText: {
        fontSize: 13,
        color: '#444',
        lineHeight: 18,
    },
    notifTime: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
});

export default NotificationsWidget;
