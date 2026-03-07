import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';


const Sidebar = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();

    const menuItems = [
        { label: 'Home', icon: 'home' as const, routeName: 'Home' as const },
        { label: 'Attendance', icon: 'account-clock-outline' as const, routeName: 'Attendance' as const },
        { label: 'Leave', icon: 'calendar-blank' as const, routeName: 'Leave' as const },
        { label: 'Project', icon: 'briefcase-outline' as const, routeName: 'Project' as const },
        { label: 'Project Tasks', icon: 'checkbox-marked-circle-outline' as const, routeName: 'ProjectTasks' as const },
        { label: 'Time Log', icon: 'clock-outline' as const, routeName: 'TimeLog' as const },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
            <ScrollView contentContainerStyle={styles.menuList} showsVerticalScrollIndicator={false}>
                {menuItems.map((item) => {
                    const isActive = route.name === item.routeName;
                    return (
                        <Pressable
                            key={item.label}
                            style={styles.menuItem}
                            onPress={() => navigation.navigate(item.routeName)}
                        >
                            <>
                                <View style={[
                                    styles.iconContainer,
                                    isActive && styles.activeIconContainer
                                ]}>
                                    <MaterialCommunityIcons
                                        name={item.icon}
                                        size={24}
                                        color={isActive ? '#FF7A00' : '#FFF5EB'}
                                    />
                                </View>
                                <Text style={[styles.label, isActive && styles.activeLabel]}>
                                    {item.label}
                                </Text>
                            </>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 68,
        backgroundColor: '#101e62ff',
        height: '100%',
        borderRightWidth: 1,
        borderRightColor: '#0f1a51',
        alignItems: 'center',
        paddingTop: 5,
    },
    logoContainer: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    logo: {
        width: 55,
        height: 55,
    },
    menuList: {
        alignItems: 'center',
    },
    menuItem: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        marginBottom: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        transitionProperty: 'background-color',
        transitionDuration: '200ms',
    } as any,
    activeIconContainer: {
        backgroundColor: '#FFF5EB',
    },
    label: {
        color: '#FFF5EB',
        fontSize: 10,
        fontWeight: '500',
        marginTop: 6,
        textAlign: 'center',
    },
    activeLabel: {
        color: '#FFF5EB',
        fontWeight: '600',
    },
});

export default Sidebar;
