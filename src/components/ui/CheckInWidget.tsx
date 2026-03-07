import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardCard from './DashboardCard';
import { useAuth } from '../../context/AuthContext';
import { attendanceSessionService } from '../../features/attendance/attendanceSession.service';
import { cameraService } from '../../services/camera.service';

const CheckInWidget = () => {
    const { userEmail, accountId } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null); // Base64 for upload
    const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null); // URI for preview
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPresent, setIsPresent] = useState(false);
    const [checkInTime, setCheckInTime] = useState('--:--');
    const [checkInDateTime, setCheckInDateTime] = useState<Date | null>(null);
    const [durationLabel, setDurationLabel] = useState<string | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [flowType, setFlowType] = useState<'in' | 'out'>('in');

    const cameraRef = useRef<any>(null);

    // Restore session on mount
    React.useEffect(() => {
        if (accountId) {
            const restoreSession = async () => {
                const activeSession = await attendanceSessionService.getActiveWorkSession(accountId);
                if (activeSession) {
                    setIsPresent(true);
                    setCurrentSessionId(activeSession.id);
                    const checkInDate = new Date(activeSession.checkInTime);
                    setCheckInDateTime(checkInDate);
                    // Format the timestamp (e.g., "HH:MM AM/PM")
                    const time = checkInDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    setCheckInTime(time);
                }
            };
            restoreSession();
        }
    }, [accountId]);

    // Timer Logic
    React.useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isPresent && checkInDateTime) {
            const updateTimer = () => {
                const now = new Date();
                const diffMs = now.getTime() - checkInDateTime.getTime();

                if (diffMs < 0) return;

                const diffSeconds = Math.floor(diffMs / 1000);
                const hours = Math.floor(diffSeconds / 3600);
                const minutes = Math.floor((diffSeconds % 3600) / 60);
                const seconds = diffSeconds % 60;

                let label = "Checked in for ";
                if (hours > 0) {
                    label += `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
                } else {
                    label += `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
                }
                setDurationLabel(label);
            };

            updateTimer(); // Initial call
            interval = setInterval(updateTimer, 1000);
        } else {
            setDurationLabel(null);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPresent, checkInDateTime]);

    const handleStartCamera = async (type: 'in' | 'out' = 'in') => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert('Permission Required', 'Camera access is needed.');
                return;
            }
        }
        setFlowType(type);
        setIsCameraActive(true);
        setCapturedImage(null);
        setCapturedImageUri(null);
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync(cameraService.getCaptureOptions());
                if (photo) {
                    // Store both: base64 for API, URI for UI display
                    setCapturedImage(photo.base64 || null);
                    setCapturedImageUri(photo.uri);
                    setIsCameraActive(false);
                }
            } catch (error) {
                console.error('[CheckInWidget] Capture Error:', error);
                Alert.alert('Error', 'Failed to capture photo.');
            }
        }
    };

    const confirmCheckIn = async () => {
        if (!capturedImage || !accountId) return;

        setIsSubmitting(true);
        try {
            if (flowType === 'in') {
                const sessionId = await attendanceSessionService.checkIn(accountId, capturedImage);
                const now = new Date();
                setIsPresent(true);
                setCurrentSessionId(sessionId);
                setCheckInDateTime(now);
                setCheckInTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                Alert.alert('Success', 'Check-in completed successfully!');
            } else {
                if (!currentSessionId) throw new Error('No active session found.');
                await attendanceSessionService.checkOut(currentSessionId, capturedImage);
                setIsPresent(false);
                setCurrentSessionId(null);
                setCheckInDateTime(null);
                setDurationLabel(null);
                setCheckInTime('--:--');
                Alert.alert('Success', 'Check-out completed successfully!');
            }

            setCapturedImage(null);
            setCapturedImageUri(null);
        } catch (error: any) {
            console.error('[CheckInWidget] Error:', error);
            Alert.alert('Operation Failed', error.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardCard style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Attendance</Text>
                    <Text style={styles.date}>{new Date().toDateString()}</Text>
                </View>
                {isPresent && (
                    <View style={styles.presentBadge}>
                        <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
                        <Text style={styles.presentText}>Checked In</Text>
                    </View>
                )}
            </View>

            <View style={styles.contentArea}>
                {capturedImageUri ? (
                    <View style={styles.previewContainer}>
                        <Image
                            source={{ uri: capturedImageUri }}
                            style={styles.previewImage}
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            style={styles.retakeButton}
                            onPress={() => handleStartCamera(flowType)}
                        >
                            <MaterialCommunityIcons name="refresh" size={16} color="#FF7A00" />
                            <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>
                    </View>
                ) : isCameraActive ? (
                    <View style={styles.cameraWrapper}>
                        <CameraView
                            ref={cameraRef}
                            style={styles.camera}
                            facing={cameraService.getFacing()}
                        />
                        <View style={styles.cameraOverlay}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setIsCameraActive(false)}>
                                <MaterialCommunityIcons name="close" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                                <View style={styles.captureInner} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.infoContainer}>
                        <View style={styles.timerBox}>
                            <Text style={styles.timeLabel}>Entry Time</Text>
                            <Text style={styles.timeValue}>{checkInTime}</Text>
                            {isPresent && durationLabel && (
                                <View style={styles.liveTimerContainer}>
                                    <View style={styles.dot} />
                                    <Text style={styles.durationText}>{durationLabel}</Text>
                                </View>
                            )}
                        </View>
                        {!isPresent && (
                            <Text style={styles.instructionText}>
                                Please capture a selfie to record your attendance.
                            </Text>
                        )}
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                {!isCameraActive && (
                    capturedImageUri ? (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                flowType === 'in' ? styles.submitButton : styles.checkOutButton
                            ]}
                            onPress={confirmCheckIn}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {flowType === 'in' ? 'Confirm Check-in' : 'Confirm Check-out'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    ) : !isPresent ? (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.startCameraButton]}
                            onPress={() => handleStartCamera('in')}
                        >
                            <MaterialCommunityIcons name="camera-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>Check-in Now</Text>
                        </TouchableOpacity>
                    ) : null
                )}

                {isPresent && !isCameraActive && !capturedImage && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.checkOutButton]}
                        onPress={() => handleStartCamera('out')}
                        disabled={isSubmitting}
                    >
                        <MaterialCommunityIcons name="logout" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.buttonText}>Check-out Now</Text>
                    </TouchableOpacity>
                )}
            </View>
        </DashboardCard>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        height: 300, // Fixed height to prevent card shrinking/growing
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12, // Reduced from 20
    },
    title: {
        fontSize: 16, // Reduced 
        fontWeight: '700',
        color: '#1A1C1E',
    },
    date: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 1,
    },
    presentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        gap: 4,
    },
    presentText: {
        fontSize: 11,
        color: '#2E7D32',
        fontWeight: '600',
    },
    contentArea: {
        flex: 1, // Take all available space
        width: '100%',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cameraWrapper: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        justifyContent: 'space-between',
        padding: 10,
    },
    cancelButton: {
        alignSelf: 'flex-end',
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButton: {
        alignSelf: 'center',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    captureInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
    },
    previewContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    retakeButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        ...Platform.select({
            web: {
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            },
            default: {
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
            }
        }),
        gap: 4,
    },
    retakeText: {
        fontSize: 11,
        color: '#FF7A00',
        fontWeight: '600',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    timerBox: {
        alignItems: 'center',
        marginBottom: 4,
    },
    timeLabel: {
        fontSize: 10,
        color: '#8E8E93',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 2,
    },
    timeValue: {
        fontSize: 24, // Reduced from 32
        fontWeight: '800',
        color: '#002D52',
    },
    instructionText: {
        fontSize: 11,
        color: '#8E8E93',
        textAlign: 'center',
    },
    footer: {
        width: '100%',
        marginTop: 12, // Gap between content area and buttons
        minHeight: 0,
    },
    actionButton: {
        height: 40, // Reduced from 48
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    startCameraButton: {
        backgroundColor: '#3C286D',
    },
    submitButton: {
        backgroundColor: '#002D52',
    },
    checkOutButton: {
        backgroundColor: '#D32F2F',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    statusBox: {
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
    },
    statusLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    liveTimerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8, // Reduced from 16
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
    },
    durationText: {
        fontSize: 13,
        color: '#2E7D32',
        fontWeight: '600',
    },
});

export default CheckInWidget;
