import React from 'react';
import { View, StyleSheet, ImageBackground, useWindowDimensions } from 'react-native';
import MainLayout from '../components/layout/MainLayout';
import ProfileSummary from '../components/ui/ProfileSummary';
import CheckInWidget from '../components/ui/CheckInWidget';
import ActivityTabs from '../components/ui/ActivityTabs';
import ActivityContentCard from '../components/ui/ActivityContentCard';
import { useAuth } from '../context/AuthContext';

const HomeScreen = () => {
    const { userEmail } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width > 1024; // Wider threshold for dual column
    const userName = userEmail?.split('@')[0] || 'User';

    return (
        <MainLayout title="Overview">
            <View style={styles.container}>
                {/* Full Width Banner Section */}
                <ImageBackground
                    source={require('../../assets/overview-banner.png')}
                    style={styles.banner}
                    imageStyle={styles.bannerImage}
                >
                    <View style={styles.bannerOverlay} />
                </ImageBackground>

                {/* Overlapping Content Section */}
                <View style={styles.contentRoot}>
                    <View style={[styles.overlapContainer, isDesktop && styles.desktopRow]}>
                        {/* Left Column: Profile & Attendance */}
                        <View style={styles.leftColumn}>
                            <View style={styles.profileWrapper}>
                                <ProfileSummary name={userName} email={userEmail || ''} />
                            </View>
                            <View style={styles.attendanceWrapper}>
                                <CheckInWidget />
                            </View>
                        </View>

                        {/* Right Column: Activities & Approvals (Desktop Only feature or stacked) */}
                        <View style={styles.rightColumn}>
                            <ActivityTabs />
                            <ActivityContentCard />
                        </View>
                    </View>
                </View>
            </View>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    banner: {
        height: 140,
        width: '100%',
    },
    bannerImage: {
        flex: 1,
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    contentRoot: {
        paddingHorizontal: 24,
        marginTop: -30,
        zIndex: 10,
        width: '100%',
        alignItems: 'center',
    },
    overlapContainer: {
        width: '100%',
        maxWidth: 1400,
        flexDirection: 'column',
        gap: 10,
    },
    desktopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    leftColumn: {
        width: '100%',
        maxWidth: 400,
    },
    rightColumn: {
        flex: 1,
        width: '100%',
    },
    profileWrapper: {
        width: '100%',
    },
    attendanceWrapper: {
        width: '100%',
        marginTop: 16,
    },
});

export default HomeScreen;
