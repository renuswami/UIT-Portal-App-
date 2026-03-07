import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/navigation/types';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import LeaveScreen from './src/screens/LeaveScreen';
import ProjectScreen from './src/screens/ProjectScreen';
import ProjectTasksScreen from './src/screens/ProjectTasksScreen';
import TimeLogScreen from './src/screens/TimeLogScreen';
import RegularizationScreen from './src/screens/RegularizationScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HolidayScreen from './src/screens/HolidayScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="Leave" component={LeaveScreen} />
            <Stack.Screen name="Project" component={ProjectScreen} />
            <Stack.Screen name="ProjectTasks" component={ProjectTasksScreen} />
            <Stack.Screen name="TimeLog" component={TimeLogScreen} />
            <Stack.Screen name="Regularization" component={RegularizationScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Holiday" component={HolidayScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
