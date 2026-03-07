import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LeaveBalanceCardProps {
    type: string;
    balance: number;
    color: string;
    icon: string;
    onApply: () => void;
}

const LeaveBalanceCard: React.FC<LeaveBalanceCardProps> = ({ type, balance, color, icon, onApply }) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                    <MaterialCommunityIcons name={icon as any} size={22} color={color} />
                </View>
                <Text style={styles.typeText}>{type}</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceValue}>{balance.toString().padStart(2, '0')}</Text>
                    <Text style={styles.balanceLabel}>Available Days</Text>
                </View>
                <TouchableOpacity style={styles.applyButton} onPress={onApply}>
                    <Text style={styles.applyButtonText}>Apply Leave</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        minWidth: 160,
        flex: 1,
        ...Platform.select({
            web: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            },
            default: {
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            }
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1C1E',
    },
    content: {
        flexDirection: 'column',
        gap: 12,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    balanceValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#002D52',
    },
    balanceLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    applyButton: {
        backgroundColor: '#F8F9FA',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#002D52',
        fontSize: 12,
        fontWeight: '700',
    },
});

export default LeaveBalanceCard;
