import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import {
    attendanceService,
    LeaveRecord,
} from '../services/attendance.service';

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Optional Leave', 'Other'];
const DAY_TYPES = ['Full Day', '1st Half', '2nd Half'];

const FILTER_OPTIONS = [
    { label: 'This Month', value: 'this_month' },
    { label: 'Previous Month', value: 'prev_month' },
    { label: 'This Year', value: 'this_year' },
    { label: 'All', value: 'all' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDateLabel = (isoDate: string) => {
    if (!isoDate) return '—';
    const [y, m, d] = isoDate.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
};

const calcTotalDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    try {
        const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 3600 * 24);
        return diff >= 0 ? Math.floor(diff) + 1 : 0;
    } catch {
        return 0;
    }
};

const todayISO = () => new Date().toISOString().split('T')[0];

/** Filter records by the selected period */
const filterRecords = (records: LeaveRecord[], filter: string): LeaveRecord[] => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    return records.filter(rec => {
        if (!rec.startDate) return filter === 'all';
        const d = new Date(rec.startDate);
        if (filter === 'this_month') return d.getFullYear() === y && d.getMonth() === m;
        if (filter === 'prev_month') {
            const pm = m === 0 ? 11 : m - 1;
            const py = m === 0 ? y - 1 : y;
            return d.getFullYear() === py && d.getMonth() === pm;
        }
        if (filter === 'this_year') return d.getFullYear() === y;
        return true;
    });
};

// ─── Status Badge ─────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
    const s = status?.toLowerCase();
    const config =
        s === 'approved' ? { bg: '#E8F5E9', color: '#2E7D32', label: 'Approved' } :
            s === 'rejected' ? { bg: '#FFEBEE', color: '#C62828', label: 'Rejected' } :
                { bg: '#FFF8E1', color: '#F57F17', label: 'Pending' };
    return (
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
};

// ─── Leave Card ───────────────────────────────────────────────────────────

const LeaveCard = ({ item }: { item: LeaveRecord }) => {
    const totalDays = item.totalDays ?? calcTotalDays(item.startDate, item.endDate);
    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={styles.cardDateRow}>
                    <MaterialCommunityIcons name="calendar-range" size={16} color="#002D52" />
                    <Text style={styles.cardDate}>{formatDateLabel(item.startDate)} {item.endDate !== item.startDate ? `- ${formatDateLabel(item.endDate)}` : ''}</Text>
                </View>
                <StatusBadge status={item.status || 'Pending'} />
            </View>
            <View style={styles.cardBody}>
                <View style={styles.cardField}>
                    <Text style={styles.cardFieldLabel}>Type</Text>
                    <Text style={styles.cardFieldValue}>{item.type || '—'}</Text>
                </View>
                <View style={styles.cardField}>
                    <Text style={styles.cardFieldLabel}>Total Days</Text>
                    <Text style={styles.cardFieldValue}>{totalDays} Day{totalDays > 1 ? 's' : ''}</Text>
                </View>
            </View>
            {!!item.description && (
                <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
            )}
        </View>
    );
};

// ─── Shared web input style ───────────────────────────────────────────────

const webInputStyle: React.CSSProperties = {
    width: '100%',
    height: 40,
    border: '1px solid #E0E0E0',
    borderRadius: 6,
    padding: '0 10px',
    fontSize: 14,
    color: '#1A1C1E',
    backgroundColor: '#F8F9FA',
    outline: 'none',
    boxSizing: 'border-box',
};

// ─── Web Date Input ───────────────────────────────────────────────────────

const WebDateInput = ({ value, onChange, label, min }: {
    value: string; onChange: (v: string) => void; label: string; min?: string;
}) => (
    <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {Platform.OS === 'web' ? (
            <input
                type="date"
                value={value}
                min={min}
                onChange={(e) => onChange(e.target.value)}
                style={webInputStyle}
            />
        ) : (
            <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#AAA"
                value={value}
                onChangeText={onChange}
            />
        )}
    </View>
);

// ─── Type Selector (Web & Mobile) ─────────────────────────────────────────

const TypeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const [nativeOpen, setNativeOpen] = useState(false);
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Leave Type *</Text>
            {Platform.OS === 'web' ? (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={webInputStyle}
                >
                    <option value="">Select Type</option>
                    {LEAVE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            ) : (
                <>
                    <TouchableOpacity style={styles.nativeSelect} onPress={() => setNativeOpen(true)}>
                        <Text style={value ? styles.nativeSelectValue : styles.nativeSelectPlaceholder}>
                            {value || 'Select Type'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    <Modal visible={nativeOpen} transparent animationType="slide">
                        <TouchableOpacity style={styles.nativePickerOverlay} onPress={() => setNativeOpen(false)}>
                            <View style={styles.nativePickerSheet}>
                                <Text style={styles.nativePickerTitle}>Select Leave Type</Text>
                                {LEAVE_TYPES.map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={styles.nativePickerOption}
                                        onPress={() => { onChange(r); setNativeOpen(false); }}
                                    >
                                        <Text style={[styles.nativePickerOptionText, value === r && styles.nativePickerOptionActive]}>{r}</Text>
                                        {value === r && <MaterialCommunityIcons name="check" size={18} color="#002D52" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </>
            )}
        </View>
    );
};

const DayTypeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const [nativeOpen, setNativeOpen] = useState(false);
    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Day Type *</Text>
            {Platform.OS === 'web' ? (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={webInputStyle}
                >
                    <option value="">Select Day Type</option>
                    {DAY_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            ) : (
                <>
                    <TouchableOpacity style={styles.nativeSelect} onPress={() => setNativeOpen(true)}>
                        <Text style={value ? styles.nativeSelectValue : styles.nativeSelectPlaceholder}>
                            {value || 'Select Day Type'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                    <Modal visible={nativeOpen} transparent animationType="slide">
                        <TouchableOpacity style={styles.nativePickerOverlay} onPress={() => setNativeOpen(false)}>
                            <View style={styles.nativePickerSheet}>
                                <Text style={styles.nativePickerTitle}>Select Day Type</Text>
                                {DAY_TYPES.map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={styles.nativePickerOption}
                                        onPress={() => { onChange(r); setNativeOpen(false); }}
                                    >
                                        <Text style={[styles.nativePickerOptionText, value === r && styles.nativePickerOptionActive]}>{r}</Text>
                                        {value === r && <MaterialCommunityIcons name="check" size={18} color="#002D52" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </>
            )}
        </View>
    );
};

// ─── Filter Bar ───────────────────────────────────────────────────────────

const FilterBar = ({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) => (
    <>
        {Platform.OS === 'web' ? (
            <select
                value={selected}
                onChange={(e) => onSelect(e.target.value)}
                style={{
                    border: '1px solid #E0E0E0',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: 13,
                    color: '#333',
                    backgroundColor: '#F8F9FA',
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: 140,
                    height: 32,
                } as React.CSSProperties}
            >
                {FILTER_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
                {FILTER_OPTIONS.map(o => (
                    <TouchableOpacity
                        key={o.value}
                        onPress={() => onSelect(o.value)}
                        style={[styles.filterChip, selected === o.value && styles.filterChipActive]}
                    >
                        <Text style={[styles.filterChipText, selected === o.value && styles.filterChipTextActive]}>{o.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        )}
    </>
);

// ─── Main Component ───────────────────────────────────────────────────────

const LeaveScreen = () => {
    const { userEmail } = useAuth();
    const [accountId, setAccountId] = useState<string | null>(null);
    const [balances, setBalances] = useState({ sick: 0, casual: 0, optional: 0 });
    const [rawLeaves, setRawLeaves] = useState<LeaveRecord[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [filterValue, setFilterValue] = useState('all');
    const [modalVisible, setModalVisible] = useState(false);

    // Form fields
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [leaveType, setLeaveType] = useState('');
    const [dayType, setDayType] = useState('Full Day');
    const [description, setDescription] = useState('');

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!userEmail) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const { accountId: accId } = await attendanceService.getUserIdByEmail(userEmail);
            setAccountId(accId);

            if (accId) {
                const [bal, lvs] = await Promise.all([
                    attendanceService.fetchLeaveBalances(accId),
                    attendanceService.fetchAllLeaves(accId)
                ]);
                setBalances(bal);
                setRawLeaves(lvs);
            }
        } catch (err) {
            console.error('[LeaveScreen] fetch error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userEmail]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredRecords = useMemo(() => filterRecords(rawLeaves, filterValue), [rawLeaves, filterValue]);
    const totalBalance = balances.sick + balances.casual + balances.optional;

    const openModal = () => {
        setFromDate('');
        setToDate('');
        setLeaveType('');
        setDayType('Full Day');
        setDescription('');
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!fromDate || !toDate || !leaveType || !dayType) {
            Alert.alert('Validation', 'Please fill in all mandatory fields.');
            return;
        }
        if (new Date(toDate) < new Date(fromDate)) {
            Alert.alert('Validation', 'To Date cannot be before From Date.');
            return;
        }

        setSubmitting(true);
        try {
            await attendanceService.createLeave({
                accountId: accountId!,
                startDate: fromDate,
                endDate: toDate,
                type: leaveType,
                dayType,
                description,
                totalDays: calcTotalDays(fromDate, toDate),
            });
            Alert.alert('Success', 'Leave application submitted successfully.');
            setModalVisible(false);
            fetchData();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to submit leave.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <MainLayout title="Leave Management">
            <View style={styles.container}>
                <View style={styles.unifiedContainer}>
                    {/* Header */}
                    <View style={styles.pageHeader}>
                        <View style={styles.pageHeaderLeft}>
                            <MaterialCommunityIcons name="calendar-check" size={20} color="#002D52" />
                            <Text style={styles.pageHeaderTitle}>Leave</Text>
                            <View style={styles.balanceHeaderRow}>
                                <View style={styles.balanceBadge}>
                                    <Text style={styles.balanceBadgeText}>Sick Leave Balance: {balances.sick}</Text>
                                </View>
                                <View style={styles.balanceBadge}>
                                    <Text style={styles.balanceBadgeText}>Casual Leave Balance: {balances.casual}</Text>
                                </View>
                                <View style={styles.balanceBadge}>
                                    <Text style={styles.balanceBadgeText}>Optional Leave Balance: {balances.optional}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.pageHeaderRight}>
                            <FilterBar selected={filterValue} onSelect={setFilterValue} />
                            <TouchableOpacity style={styles.applyBtn} onPress={openModal}>
                                <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
                                <Text style={styles.applyBtnText}>Apply Leave</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* List */}
                    {loading ? (
                        <View style={styles.centeredLoader}>
                            <ActivityIndicator size="large" color="#002D52" />
                        </View>
                    ) : (
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={styles.listContent}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} />}
                        >
                            {filteredRecords.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="calendar-blank" size={48} color="#CCC" />
                                    <Text style={styles.emptyText}>No records found.</Text>
                                </View>
                            ) : (
                                filteredRecords.map((item, idx) => <LeaveCard key={item.id || idx} item={item} />)
                            )}
                        </ScrollView>
                    )}
                </View>
            </View>

            {/* Apply Leave Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Apply Leave</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <View style={styles.formRow}>
                                <View style={styles.formCol}>
                                    <WebDateInput label="From Date *" value={fromDate} onChange={setFromDate} />
                                </View>
                                <View style={styles.formCol}>
                                    <WebDateInput label="To Date *" value={toDate} onChange={setToDate} min={fromDate} />
                                </View>
                            </View>
                            <View style={styles.formRow}>
                                <View style={styles.formCol}>
                                    <TypeSelect value={leaveType} onChange={setLeaveType} />
                                </View>
                                <View style={styles.formCol}>
                                    <DayTypeSelect value={dayType} onChange={setDayType} />
                                </View>
                            </View>
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>Description</Text>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Reason for leave..."
                                />
                            </View>
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                                {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.submitBtnText}>Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    unifiedContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        overflow: 'hidden',
    },
    pageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    pageHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    pageHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#1A1C1E' },
    balanceHeaderRow: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 10,
        flexWrap: 'wrap',
    },
    balanceBadge: {
        backgroundColor: '#E8EDF2',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: '#D0D9E0',
    },
    balanceBadgeText: { fontSize: 11, fontWeight: '700', color: '#002D52' },
    pageHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#002D52',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    applyBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
    listContent: { padding: 16, gap: 12 },
    centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
    emptyText: { fontSize: 16, color: '#999', fontWeight: '500' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        padding: 14,
        ...Platform.select({
            web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
            default: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
        }),
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardDate: { fontSize: 14, fontWeight: '700', color: '#1A1C1E' },
    cardBody: { flexDirection: 'row', gap: 16, marginBottom: 6 },
    cardField: { flex: 1 },
    cardFieldLabel: { fontSize: 10, color: '#999', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
    cardFieldValue: { fontSize: 13, color: '#333', fontWeight: '500' },
    cardDescription: { fontSize: 12, color: '#777', marginTop: 6, fontStyle: 'italic' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 580, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1C1E' },
    modalBody: { padding: 20 },
    formRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
    formCol: { flex: 1 },
    fieldWrapper: { marginBottom: 16 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6 },
    textInput: { height: 40, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6, paddingHorizontal: 10, fontSize: 14, backgroundColor: '#F8F9FA' },
    textArea: { height: 80, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, backgroundColor: '#F8F9FA', textAlignVertical: 'top' },
    nativeSelect: { height: 40, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 6, paddingHorizontal: 10, backgroundColor: '#F8F9FA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    nativeSelectValue: { fontSize: 14, color: '#1A1C1E' },
    nativeSelectPlaceholder: { fontSize: 14, color: '#AAA' },
    nativePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    nativePickerSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 36 },
    nativePickerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    nativePickerOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    nativePickerOptionText: { fontSize: 15, color: '#333' },
    nativePickerOptionActive: { color: '#002D52', fontWeight: '600' },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', gap: 12 },
    cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#DDD' },
    cancelBtnText: { color: '#666', fontWeight: '600' },
    submitBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6, backgroundColor: '#002D52', minWidth: 80, alignItems: 'center' },
    submitBtnText: { color: '#FFF', fontWeight: '600' },
    filterChipRow: { gap: 8, paddingBottom: 4 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#FFF' },
    filterChipActive: { backgroundColor: '#002D52', borderColor: '#002D52' },
    filterChipText: { fontSize: 12, color: '#666' },
    filterChipTextActive: { color: '#FFF', fontWeight: '600' },
});

export default LeaveScreen;
