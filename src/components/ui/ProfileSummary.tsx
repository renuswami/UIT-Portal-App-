import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ProfileSummaryProps {
    name: string;
    email: string;
    employeeId?: string;
    manager?: string;
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({
    name,
    employeeId = 'UIT-17',
    manager = 'Aryan chopra'
}) => {
    const initial = name.charAt(0).toUpperCase();

    return (
        <View style={styles.container}>
            {/* Main Profile Info Card */}
            <View style={styles.profileCard}>
                {/* Overlapping Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                </View>

                <View style={styles.nameSection}>
                    <Text style={styles.nameLabel}>
                        <Text style={styles.empId}>{employeeId}</Text> - <Text style={styles.nameText}>{name}</Text>
                    </Text>
                </View>
            </View>

            {/* Reporting To Section - Separate Card */}
            <View style={styles.reportingCard}>
                <View style={styles.reportingIconContainer}>
                    <MaterialCommunityIcons name="account" size={40} color="#D1D9E0" />
                </View>
                <View style={styles.reportingInfo}>
                    <Text style={styles.reportingLabel}>Reporting To</Text>
                    <Text style={styles.managerName}>
                        <Text style={styles.managerId}>UIT-1</Text> - <Text style={styles.managerText}>{manager}</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: 10,
        paddingTop: 37,
        paddingBottom: 15, // Increased height
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 12,
    },
    avatarContainer: {
        position: 'absolute',
        top: -42,
        backgroundColor: '#FFFFFF',
        padding: 2, // Thinned boundary
        borderRadius: 14,
    },
    avatar: {
        width: 84, // Reduced from 80
        height: 84,
        backgroundColor: '#B33C12',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 52, // Reduced
        fontWeight: '500',
    },
    nameSection: {
        marginTop: 12,
    },
    nameLabel: {
        fontSize: 14, // Reduced
        color: '#1A1C1E',
    },
    empId: {
        color: '#666',
        fontWeight: '500',
    },
    nameText: {
        fontWeight: '700',
    },
    reportingCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: 12,
        padding: 10, // Reduced from 16
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    reportingIconContainer: {
        width: 40, // Reduced from 50
        height: 40,
        backgroundColor: '#F3F6F9',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    reportingInfo: {
        flex: 1,
    },
    reportingLabel: {
        fontSize: 12, // Reduced
        color: '#666',
        marginBottom: 1,
    },
    managerName: {
        fontSize: 13, // Reduced
        color: '#1A1C1E',
    },
    managerId: {
        color: '#666',
        fontWeight: '500',
    },
    managerText: {
        fontWeight: '700',
    },
});

export default ProfileSummary;
