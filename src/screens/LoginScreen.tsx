import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    useWindowDimensions,
    ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const LoginScreen = () => {
    const { width, height } = useWindowDimensions();
    const isLargeScreen = width > 768; // Tablet/Web breakpoint

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Incomplete Fields', 'Please enter both username and password.');
            return;
        }

        setLoading(true);
        try {
            const { accountId, username: matchedUsername } = await authService.login(
                username.trim(),
                password.trim()
            );

            await login(matchedUsername, accountId);

        } catch (error: any) {
            let message = 'Connection Error. Please check your internet connection.';

            if (error.message === 'Invalid username or password') {
                message = 'Invalid username or password.';
            } else if (error.message && error.message.includes('Auth Error:')) {
                message = error.message;
            }

            Alert.alert('Login Failed', message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.centeredWrapper}>
                    {/* Outer Gradient Border */}
                    <LinearGradient
                        colors={['#8E24AA', '#F4511E']} // Purple to Orange
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.gradientBorder, isLargeScreen ? styles.largeCard : styles.mobileCard]}
                    >
                        <View style={styles.cardInner}>
                            <View style={[styles.mainLayout, isLargeScreen ? styles.row : styles.column]}>

                                {/* Left Section: Form */}
                                <View style={[styles.formSection, isLargeScreen && styles.leftHalf]}>
                                    <View style={styles.formContainer}>
                                        <Text style={styles.headerText}>User Login</Text>

                                        <View style={styles.inputWrapper}>
                                            <MaterialIcons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                                            <TextInput
                                                style={[styles.inputField, Platform.OS === 'web' && { outline: 'none' } as any]}
                                                placeholder="Username"
                                                placeholderTextColor="#999"
                                                value={username}
                                                onChangeText={setUsername}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                editable={!loading}
                                            />
                                        </View>

                                        <View style={styles.inputWrapper}>
                                            <MaterialIcons name="lock-outline" size={20} color="#999" style={styles.inputIcon} />
                                            <TextInput
                                                style={[styles.inputField, Platform.OS === 'web' && { outline: 'none' } as any]}
                                                placeholder="********"
                                                placeholderTextColor="#999"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                editable={!loading}
                                            />
                                        </View>

                                        <View style={styles.optionsRow}>
                                            <TouchableOpacity
                                                style={styles.checkboxContainer}
                                                onPress={() => setRememberMe(!rememberMe)}
                                            >
                                                <MaterialIcons
                                                    name={rememberMe ? "check-box" : "check-box-outline-blank"}
                                                    size={18}
                                                    color="#666"
                                                />
                                                <Text style={styles.optionText}>Remember me</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity>
                                                <Text style={styles.forgotText}>Forgot Password?</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.submitButton, loading && styles.buttonDisabled]}
                                            onPress={handleLogin}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Text style={styles.submitText}>SUBMIT</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Right Section: Illustration */}
                                {isLargeScreen && (
                                    <View style={styles.illustrationSection}>
                                        <Image
                                            source={require('../../assets/login-illustration.png')}
                                            style={styles.illustrationImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                )}
                                {!isLargeScreen && (
                                    <View style={styles.mobileIllustration}>
                                        <Image
                                            source={require('../../assets/login-illustration.png')}
                                            style={styles.mobileImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    centeredWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    gradientBorder: {
        padding: 2, // Border thickness
        borderRadius: 15,
        ...Platform.select({
            web: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)' },
            default: {
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            }
        })
    },
    largeCard: {
        width: '100%',
        maxWidth: 900,
        height: 550,
    },
    mobileCard: {
        width: '100%',
    },
    cardInner: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 13,
        overflow: 'hidden',
    },
    mainLayout: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
    },
    column: {
        flexDirection: 'column-reverse',
    },
    formSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 20,
    },
    leftHalf: {
        maxWidth: '45%',
    },
    formContainer: {
        width: '100%',
    },
    headerText: {
        fontSize: 32,
        fontWeight: '700',
        color: '#E53935',
        marginBottom: 35,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F7',
        borderRadius: 25,
        paddingHorizontal: 20,
        marginBottom: 15,
        height: 50,
    },
    inputIcon: {
        marginRight: 10,
    },
    inputField: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
        paddingHorizontal: 5,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 11,
        color: '#666',
        marginLeft: 4,
    },
    forgotText: {
        fontSize: 11,
        color: '#999',
    },
    submitButton: {
        backgroundColor: '#E53935',
        height: 50,
        width: '60%',
        alignSelf: 'center',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
    },
    buttonDisabled: {
        backgroundColor: '#EF9A9A',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    illustrationSection: {
        flex: 1.1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        borderLeftWidth: 1,
        borderLeftColor: '#F0F0F0',
    },
    illustrationImage: {
        width: '100%',
        height: '90%',
    },
    mobileIllustration: {
        width: '100%',
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    mobileImage: {
        width: '100%',
        height: '100%',
    },
});

export default LoginScreen;
