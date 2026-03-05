import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ActivityTabs = () => {
    const [activeTab, setActiveTab] = useState('Approvals');

    const tabs = [
        { label: 'Activities', key: 'Activities' },
        { label: 'Feeds', key: 'Feeds' },
        { label: 'Profile', key: 'Profile' },
        { label: 'Approvals', key: 'Approvals' },
        { label: 'Leave', key: 'Leave' },
        { label: 'Files', key: 'Files' },
        { label: 'Related Data', key: 'Related Data' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, isActive && styles.activeTab]}
                                onPress={() => setActiveTab(tab.key)}
                            >
                                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <TouchableOpacity style={styles.filterButton}>
                    <MaterialCommunityIcons name="tune-variant" size={20} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 16,
        width: '100%',
    },
    tabBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    tab: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: '#3498DB', // Standard blue for this section
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#1A1C1E',
        fontWeight: '700',
    },
    filterButton: {
        padding: 8,
        marginLeft: 'auto',
    },
});

export default ActivityTabs;
