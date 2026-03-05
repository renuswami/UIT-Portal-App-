import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DashboardCard from './DashboardCard';

const GreetingCard = ({ name }: { name: string }) => {
    return (
        <DashboardCard style={styles.container}>
            <Text style={styles.greeting}>Good Afternoon, {name} 👋</Text>
            <Text style={styles.subtitle}>Have a productive day!</Text>
            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>12</Text>
                    <Text style={styles.statLabel}>Tasks Pending</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>02</Text>
                    <Text style={styles.statLabel}>Upcoming Leaves</Text>
                </View>
            </View>
        </DashboardCard>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 2,
        backgroundColor: '#002D52',
        minWidth: 350,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0B0C0',
        marginBottom: 25,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 15,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    statLabel: {
        fontSize: 12,
        color: '#A0B0C0',
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
});

export default GreetingCard;
