import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MainLayout from '../components/layout/MainLayout';

const ProjectTasksScreen = () => {
    return (
        <MainLayout title="Project Tasks">
            <View style={styles.container}>
                <Text style={styles.title}>Task List</Text>
                <Text style={styles.content}>Track your project tasks and milestones here.</Text>
            </View>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 1240,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1C1E',
        marginBottom: 8,
    },
    content: {
        fontSize: 14,
        color: '#8E8E93',
    },
});

export default ProjectTasksScreen;
