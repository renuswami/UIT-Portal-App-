import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
    Home: undefined;
    Attendance: undefined;
    Leave: undefined;
    Project: undefined;
    ProjectTasks: undefined;
    TimeLog: undefined;
};

const BottomNav = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();

    const items = [
        { label: 'Home', icon: 'home' as const, routeName: 'Home' as const },
        { label: 'Attendance', icon: 'account-clock-outline' as const, routeName: 'Attendance' as const },
        { label: 'Leave', icon: 'calendar-blank' as const, routeName: 'Leave' as const },
        { label: 'Project', icon: 'briefcase-outline' as const, routeName: 'Project' as const },
        { label: 'Tasks', icon: 'checkbox-marked-circle-outline' as const, routeName: 'ProjectTasks' as const },
        { label: 'Time', icon: 'clock-outline' as const, routeName: 'TimeLog' as const },
    ];

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {items.map((item) => {
                    const isActive = route.name === item.routeName;
                    return (
                        <TouchableOpacity
                            key={item.label}
                            style={styles.item}
                            onPress={() => navigation.navigate(item.routeName)}
                        >
                            <MaterialCommunityIcons
                                name={item.icon}
                                size={22}
                                color={isActive ? '#002D52' : '#8E8E93'}
                            />
                            <Text style={[styles.label, isActive && styles.activeLabel]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 70,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingBottom: 5,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    item: {
        width: 75,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
    },
    label: {
        fontSize: 10,
        color: '#8E8E93',
        marginTop: 4,
    },
    activeLabel: {
        color: '#002D52',
        fontWeight: 'bold',
    },
});

export default BottomNav;
