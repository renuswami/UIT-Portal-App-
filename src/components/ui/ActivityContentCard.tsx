import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';

const ActivityContentCard = () => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../../../assets/empty_approvals.png')}
                    style={styles.illustration}
                    resizeMode="contain"
                />
                <Text style={styles.statusText}>All set! No requests pending approval</Text>
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
        flex: 1, // Take remaining vertical space
        minHeight: 390,
        width: '100%',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    illustration: {
        width: 300,
        height: 200,
        marginBottom: 24,
    },
    statusText: {
        fontSize: 16,
        color: '#1A1C1E',
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default ActivityContentCard;
