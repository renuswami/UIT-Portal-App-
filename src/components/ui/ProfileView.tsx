import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendance.service';

// ─── Sub-Components ───────────────────────────────────────────────────────

const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
    <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon as any} size={20} color="#002D52" />
        <Text style={styles.sectionTitle}>{title}</Text>
    </View>
);

const InfoRow = ({ label, value }: { label: string, value: any }) => (
    <View style={styles.infoField}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
);

const formatAddress = (addr: any) => {
    if (!addr) return '—';
    if (typeof addr === 'string') return addr;
    const parts = [
        addr.street,
        addr.city,
        addr.state || addr.stateCode,
        addr.postalCode,
        addr.country || addr.countryCode
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '—';
};

const BalanceCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <View style={[styles.balanceCard, { borderLeftColor: color }]}>
        <Text style={styles.balanceValue}>{value}</Text>
        <Text style={styles.balanceLabel}>{label}</Text>
    </View>
);

const DocumentRow = ({ label }: { label: string }) => (
    <View style={styles.documentRow}>
        <Text style={styles.documentLabel}>{label}</Text>
        <Text style={styles.documentStatus}>No file chosen</Text>
    </View>
);

// ─── Main Component ───────────────────────────────────────────────────────

const ProfileView = () => {
    const { userEmail } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (!userEmail) return;
            try {
                const { accountId } = await attendanceService.getUserIdByEmail(userEmail);
                if (accountId) {
                    const data = await attendanceService.fetchProfileDetails(accountId);
                    setProfile(data);
                }
            } catch (error) {
                console.error('[ProfileView] Error loading profile:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [userEmail]);

    if (loading) {
        return (
            <View style={styles.centeredLoader}>
                <ActivityIndicator size="large" color="#002D52" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.centeredLoader}>
                <Text style={styles.errorText}>Profile not found.</Text>
            </View>
        );
    }

    const fullName = `${profile.Salutation || ''} ${profile.FirstName || ''} ${profile.LastName || ''}`.trim();
    const initial = profile.FirstName?.charAt(0).toUpperCase() || '?';

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* 1. Profile Card Section */}
            <View style={styles.profileCard}>
                <View style={styles.profileCardTop}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                    <View style={styles.mainInfo}>
                        <Text style={styles.profileName}>{fullName}</Text>
                        <Text style={styles.profilePosition}>{profile.Position__c || 'Position'}</Text>
                        <Text style={styles.profileDept}>{profile.PersonDepartment || 'Department'}</Text>
                    </View>
                </View>
                <View style={styles.profileCardBody}>
                    <View style={styles.miniInfoRow}>
                        <MaterialCommunityIcons name="email-outline" size={14} color="#666" />
                        <Text style={styles.miniInfoText}>{profile.PersonEmail}</Text>
                    </View>
                    <View style={styles.miniInfoRow}>
                        <MaterialCommunityIcons name="phone-outline" size={14} color="#666" />
                        <Text style={styles.miniInfoText}>{profile.PersonMobilePhone}</Text>
                    </View>
                    <View style={styles.miniInfoRow}>
                        <MaterialCommunityIcons name="calendar-import" size={14} color="#666" />
                        <Text style={styles.miniInfoText}>Joined: {profile.Joining_Date__c}</Text>
                    </View>
                    <View style={styles.miniInfoRow}>
                        <MaterialCommunityIcons name="briefcase-outline" size={14} color="#666" />
                        <Text style={styles.miniInfoText}>Exp: {profile.Total_Experience__c} Years</Text>
                    </View>
                </View>
            </View>

            {/* 2. Personal Information Section */}
            <View style={styles.section}>
                <SectionHeader title="Personal Information" icon="account-details-outline" />
                <View style={styles.grid}>
                    <InfoRow label="Birthdate" value={profile.PersonBirthdate} />
                    <InfoRow label="Gender Identity" value={profile.PersonGenderIdentity} />
                    <InfoRow label="Aadhar Number" value={profile.Aadhar_Number__c} />
                    <InfoRow label="PAN Number" value={profile.PAN_Number__c} />
                    <InfoRow label="UAN Number" value={profile.UAN_Number__c} />
                    <InfoRow label="Personal Email" value={profile.PersonEmail} />
                    <InfoRow label="Mobile" value={profile.PersonMobilePhone} />
                    <InfoRow label="Home Phone" value={profile.PersonHomePhone} />
                </View>
            </View>

            {/* 3. Address Information */}
            <View style={styles.section}>
                <SectionHeader title="Address Information" icon="map-marker-outline" />
                <InfoRow label="Current Address" value={formatAddress(profile.Current_Address__c)} />
                {JSON.stringify(profile.Permanent_Address__c) !== JSON.stringify(profile.Current_Address__c) && (
                    <InfoRow label="Permanent Address" value={formatAddress(profile.Permanent_Address__c)} />
                )}
                <View style={styles.grid}>
                    <InfoRow label="City" value={profile.City__c} />
                    <InfoRow label="State / Union Territory" value={profile.States_Union_Territories__c} />
                    <InfoRow label="Country" value={profile.Country__c} />
                </View>
            </View>

            {/* 4. Emergency Contact */}
            <View style={styles.section}>
                <SectionHeader title="Emergency Contact" icon="phone-alert-outline" />
                <View style={styles.grid}>
                    <InfoRow label="Contact Name" value={profile.Emergency_Contact_Name__c} />
                    <InfoRow label="Phone Number" value={profile.Emergency_Contact_Phone_Number__c} />
                    <InfoRow label="Relation" value={profile.Emergency_Contact_Relation__c} />
                </View>
            </View>

            {/* 5. Employment Information */}
            <View style={styles.section}>
                <SectionHeader title="Employment Information" icon="briefcase-check-outline" />
                <View style={styles.grid}>
                    <InfoRow label="Employee ID" value={profile.Account_ID__c} />
                    <InfoRow label="Position" value={profile.Position__c} />
                    <InfoRow label="Level" value={profile.Level__pc} />
                    <InfoRow label="Department" value={profile.PersonDepartment} />
                    <InfoRow label="Joining Date" value={profile.Joining_Date__c} />
                    <InfoRow label="Reporting To" value={profile.Reporting_To__r?.Name} />
                    <InfoRow label="Status" value={profile.Status__c} />
                    <InfoRow label="Total Experience" value={profile.Total_Experience__c} />
                    <InfoRow label="Current Experience" value={profile.Current_Experience__c} />
                    <InfoRow label="Previous Experience" value={profile.Previous_Experience__c} />
                </View>
            </View>

            {/* 6. Leave Balance Section */}
            <View style={styles.section}>
                <SectionHeader title="Leave Balance" icon="calendar-clock-outline" />
                <View style={styles.balanceRow}>
                    <BalanceCard label="Sick Leave" value={profile.Sick_Leave_Balance__c || 0} color="#FF9800" />
                    <BalanceCard label="Casual Leave" value={profile.Casual_Leave_Balance__c || 0} color="#4CAF50" />
                    <BalanceCard label="Optional Leave" value={profile.Optional_Leaves_Balance__c || 0} color="#2196F3" />
                </View>
            </View>

            {/* 7. Required Documentation */}
            <View style={styles.section}>
                <SectionHeader title="Required Documentation" icon="file-document-outline" />
                <DocumentRow label="10th Marksheet" />
                <DocumentRow label="12th Marksheet" />
                <DocumentRow label="Graduate Marksheet" />
                <DocumentRow label="Masters Marksheet" />
                <DocumentRow label="Aadhar Card" />
                <DocumentRow label="PAN Card" />
                <DocumentRow label="Experience/Relieving Letter" />
                <DocumentRow label="Other Attachments" />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
    errorText: { color: '#C62828', fontSize: 16, fontWeight: '600' },
    profileCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    profileCardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#002D52',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: { color: '#FFF', fontSize: 24, fontWeight: '700' },
    mainInfo: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: '700', color: '#1A1C1E' },
    profilePosition: { fontSize: 14, color: '#002D52', fontWeight: '600' },
    profileDept: { fontSize: 13, color: '#666' },
    profileCardBody: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    miniInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    miniInfoText: { fontSize: 12, color: '#555' },
    section: { marginBottom: 24, paddingHorizontal: 10 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 6 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1C1E', textTransform: 'uppercase', letterSpacing: 0.5 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    infoField: { minWidth: 140, flex: 1 },
    infoLabel: { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 13, color: '#333', fontWeight: '500' },
    balanceRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
    balanceCard: {
        flex: 1,
        minWidth: 100,
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
    },
    balanceValue: { fontSize: 20, fontWeight: '800', color: '#002D52' },
    balanceLabel: { fontSize: 11, color: '#666', fontWeight: '500' },
    documentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    documentLabel: { fontSize: 13, color: '#333', fontWeight: '500' },
    documentStatus: { fontSize: 12, color: '#999', fontStyle: 'italic' },
});

export default ProfileView;
