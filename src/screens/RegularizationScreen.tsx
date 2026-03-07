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
    RegularizationRecord,
} from '../services/attendance.service';

const REASON_TYPES = [
    'Work From Home',
    'Forget to Check-in',
    'Forget to Check-out',
    'Other',
];

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

/** Format an ISO/datetime string to just time with AM/PM */
const formatTime = (dt: string) => {
    if (!dt) return '—';
    try {
        return new Date(dt).toLocaleString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch {
        return dt;
    }
};

const calcLogHours = (checkInISO: string, checkOutISO: string): number => {
    if (!checkInISO || !checkOutISO) return 0;
    try {
        const diff = (new Date(checkOutISO).getTime() - new Date(checkInISO).getTime()) / 3600000;
        return diff > 0 ? Math.round(diff * 100) / 100 : 0;
    } catch {
        return 0;
    }
};

const formatTotalTime = (hours: number): string => {
    if (!hours || hours <= 0) return '—';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
};

const todayISO = () => new Date().toISOString().split('T')[0];

/** Combine a date (YYYY-MM-DD) and time (HH:MM) into an ISO string */
const buildISO = (date: string, time: string): string => {
    if (!date || !time) return '';
    return `${date}T${time}:00`;
};

/** Filter records by the selected period */
const filterRecords = (records: RegularizationRecord[], filter: string): RegularizationRecord[] => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed

    return records.filter(rec => {
        if (!rec.date) return filter === 'all';
        const d = new Date(rec.date);
        if (filter === 'this_month') return d.getFullYear() === y && d.getMonth() === m;
        if (filter === 'prev_month') {
            const pm = m === 0 ? 11 : m - 1;
            const py = m === 0 ? y - 1 : y;
            return d.getFullYear() === py && d.getMonth() === pm;
        }
        if (filter === 'this_year') return d.getFullYear() === y;
        return true; // 'all'
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

// ─── Regularization Card ─────────────────────────────────────────────────

const RegularizationCard = ({ item }: { item: RegularizationRecord }) => {
    const logHours = item.logHours ?? calcLogHours(item.checkIn, item.checkOut);
    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View style={styles.cardDateRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#002D52" />
                    <Text style={styles.cardDate}>{formatDateLabel(item.date)}</Text>
                </View>
                <StatusBadge status={item.approvalStatus} />
            </View>
            <View style={styles.cardBody}>
                <View style={styles.cardField}>
                    <Text style={styles.cardFieldLabel}>Reason</Text>
                    <Text style={styles.cardFieldValue}>{item.reasonType || '—'}</Text>
                </View>
                <View style={styles.cardField}>
                    <Text style={styles.cardFieldLabel}>Log Hours</Text>
                    <Text style={styles.cardFieldValue}>{formatTotalTime(logHours)}</Text>
                </View>
                <View style={styles.cardField}>
                    <Text style={styles.cardFieldLabel}>Check-in</Text>
                    <Text style={styles.cardFieldValue}>{formatTime(item.checkIn)}</Text>
                </View>
                <View style={styles.cardField}>
                    <Text style={styles.cardFieldLabel}>Check-out</Text>
                    <Text style={styles.cardFieldValue}>{formatTime(item.checkOut)}</Text>
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

const WebDateInput = ({ value, onChange, label }: {
    value: string; onChange: (v: string) => void; label: string;
}) => (
    <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {Platform.OS === 'web' ? (
            <input
                type="date"
                value={value}
                max={todayISO()}
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

// ─── Web Time Input (AM/PM) ───────────────────────────────────────────────

const WebTimeInput = ({ value, onChange, label }: {
    value: string; onChange: (v: string) => void; label: string;
}) => (
    <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {Platform.OS === 'web' ? (
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={webInputStyle}
            />
        ) : (
            <TextInput
                style={styles.textInput}
                placeholder="HH:MM"
                placeholderTextColor="#AAA"
                value={value}
                onChangeText={onChange}
            />
        )}
    </View>
);

// ─── Reason Picklist (web <select> / native custom) ───────────────────────

const ReasonSelect = ({ value, onChange }: {
    value: string; onChange: (v: string) => void;
}) => {
    const [nativeOpen, setNativeOpen] = useState(false);

    return (
        <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>
                Reason Type <Text style={styles.required}>*</Text>
            </Text>

            {Platform.OS === 'web' ? (
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{
                        ...webInputStyle,
                        cursor: 'pointer',
                        appearance: 'auto',
                    } as React.CSSProperties}
                >
                    <option value="" disabled>— Select reason —</option>
                    {REASON_TYPES.map(r => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
            ) : (
                <>
                    <TouchableOpacity
                        style={styles.nativeSelect}
                        onPress={() => setNativeOpen(true)}
                    >
                        <Text style={value ? styles.nativeSelectValue : styles.nativeSelectPlaceholder}>
                            {value || '— Select reason —'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={18} color="#888" />
                    </TouchableOpacity>

                    <Modal
                        visible={nativeOpen}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setNativeOpen(false)}
                    >
                        <TouchableOpacity
                            style={styles.nativePickerOverlay}
                            activeOpacity={1}
                            onPress={() => setNativeOpen(false)}
                        >
                            <View style={styles.nativePickerSheet}>
                                <Text style={styles.nativePickerTitle}>Reason Type</Text>
                                {REASON_TYPES.map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={styles.nativePickerOption}
                                        onPress={() => { onChange(r); setNativeOpen(false); }}
                                    >
                                        <Text style={[styles.nativePickerOptionText, value === r && styles.nativePickerOptionActive]}>
                                            {r}
                                        </Text>
                                        {value === r && (
                                            <MaterialCommunityIcons name="check" size={18} color="#002D52" />
                                        )}
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

// ─── Filter Bar (inline in header) ──────────────────────────────────────────

const FilterBar = ({ selected, onSelect }: {
    selected: string; onSelect: (v: string) => void;
}) => (
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
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipRow}
            >
                {FILTER_OPTIONS.map(o => (
                    <TouchableOpacity
                        key={o.value}
                        style={[styles.filterChip, selected === o.value && styles.filterChipActive]}
                        onPress={() => onSelect(o.value)}
                    >
                        <Text style={[styles.filterChipText, selected === o.value && styles.filterChipTextActive]}>
                            {o.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        )}
    </>
);

// ─── Main Screen ──────────────────────────────────────────────────────────

const RegularizationScreen = () => {
    const { accountId } = useAuth();

    // List state
    const [records, setRecords] = useState<RegularizationRecord[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterValue, setFilterValue] = useState('this_month');

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [date, setDate] = useState('');
    const [reasonType, setReasonType] = useState('');
    const [checkInTime, setCheckInTime] = useState('');   // HH:MM
    const [checkOutTime, setCheckOutTime] = useState(''); // HH:MM
    const [description, setDescription] = useState('');

    // Build full ISO strings from date + time for calculation
    const checkInISO = buildISO(date, checkInTime);
    const checkOutISO = buildISO(date, checkOutTime);
    const logHours = calcLogHours(checkInISO, checkOutISO);

    // Filtered records (client-side)
    const filteredRecords = useMemo(
        () => filterRecords(records, filterValue),
        [records, filterValue]
    );

    // ── Fetch list ────────────────────────────────────────────────────

    const fetchRecords = useCallback(async (isRefresh = false) => {
        if (!accountId) return;
        isRefresh ? setRefreshing(true) : setListLoading(true);
        try {
            const data = await attendanceService.fetchMyRegularizations(accountId);
            setRecords(data);
        } catch (e) {
            console.error('[Regularization] Fetch error:', e);
        } finally {
            setListLoading(false);
            setRefreshing(false);
        }
    }, [accountId]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    // ── Modal ─────────────────────────────────────────────────────────

    const openModal = () => {
        setDate('');
        setReasonType('');
        setCheckInTime('');
        setCheckOutTime('');
        setDescription('');
        setModalVisible(true);
    };

    const closeModal = () => setModalVisible(false);

    // ── Submit ────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!date) { Alert.alert('Validation', 'Please select a date.'); return; }
        if (!reasonType) { Alert.alert('Validation', 'Please select a Reason Type.'); return; }
        if (!checkInTime) { Alert.alert('Validation', 'Please enter Check-in time.'); return; }
        if (!checkOutTime) { Alert.alert('Validation', 'Please enter Check-out time.'); return; }
        if (logHours <= 0) { Alert.alert('Validation', 'Check-out must be after Check-in.'); return; }

        setSubmitting(true);
        try {
            const att = await attendanceService.fetchAttendanceByDate(date, accountId!);
            if (!att) {
                Alert.alert('No Attendance', 'No attendance record found for the selected date.');
                return;
            }

            const exists = await attendanceService.checkRegularizationExists(att.id);
            if (exists) {
                Alert.alert('Already Submitted', 'Regularization request already submitted for this date.');
                return;
            }

            await attendanceService.createRegularization({
                attendanceId: att.id,
                checkIn: new Date(checkInISO).toISOString(),
                checkOut: new Date(checkOutISO).toISOString(),
                reasonType,
                description,
                logHours,
            });

            Alert.alert('Success', 'Regularization request submitted successfully.');
            closeModal();
            fetchRecords();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to submit regularization.');
            console.error('[Regularization] Submit error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────

    return (
        <MainLayout title="Attendance">

            <View style={styles.unifiedContainer}>
                {/* ── Page Header with inline filter ── */}
                <View style={styles.pageHeader}>
                    <View style={styles.pageHeaderLeft}>
                        <MaterialCommunityIcons name="clipboard-edit-outline" size={20} color="#002D52" />
                        <Text style={styles.pageHeaderTitle}>Regularization Requests</Text>
                        {!listLoading && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{filteredRecords.length}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.pageHeaderRight}>
                        <FilterBar selected={filterValue} onSelect={setFilterValue} />
                        <TouchableOpacity style={styles.regularizeBtn} onPress={openModal}>
                            <MaterialCommunityIcons name="plus" size={16} color="#FFF" />
                            <Text style={styles.regularizeBtnText}>Regularize</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── List ── */}
                {listLoading ? (
                    <View style={styles.centeredLoader}>
                        <ActivityIndicator size="large" color="#002D52" />
                    </View>
                ) : (
                    <ScrollView
                        style={styles.listScroll}
                        contentContainerStyle={styles.listContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRecords(true)} />}
                    >
                        {filteredRecords.length === 0 ? (
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#CCC" />
                                <Text style={styles.emptyText}>No requests found.</Text>
                                <Text style={styles.emptySubText}>
                                    {filterValue === 'all'
                                        ? 'Click "Regularize" to submit a request.'
                                        : 'Try changing the filter or submit a request.'}
                                </Text>
                            </View>
                        ) : (
                            filteredRecords.map((rec) => <RegularizationCard key={rec.id} item={rec} />)
                        )}
                    </ScrollView>
                )}
            </View>

            {/* ── Modal ── */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>

                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Attendance Regularization</Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                                <MaterialCommunityIcons name="close" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>

                            {/* Row 1: Date + Reason Type */}
                            <View style={styles.formRow}>
                                <View style={styles.formCol}>
                                    <WebDateInput
                                        label="Date *"
                                        value={date}
                                        onChange={setDate}
                                    />
                                </View>
                                <View style={styles.formCol}>
                                    <ReasonSelect value={reasonType} onChange={setReasonType} />
                                </View>
                            </View>

                            {/* Row 2: Check-in Time + Check-out Time */}
                            <View style={styles.formRow}>
                                <View style={styles.formCol}>
                                    <WebTimeInput
                                        label="Check-in *"
                                        value={checkInTime}
                                        onChange={setCheckInTime}
                                    />
                                </View>
                                <View style={styles.formCol}>
                                    <WebTimeInput
                                        label="Check-out *"
                                        value={checkOutTime}
                                        onChange={setCheckOutTime}
                                    />
                                </View>
                            </View>

                            {/* Row 3: Total Time (readonly) */}
                            <View style={styles.formRow}>
                                <View style={styles.formCol}>
                                    <View style={styles.fieldWrapper}>
                                        <Text style={styles.fieldLabel}>Total Time</Text>
                                        <View style={styles.readonlyField}>
                                            <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                                            <Text style={styles.readonlyText}>{formatTotalTime(logHours)}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.formCol} />
                            </View>

                            {/* Description */}
                            <View style={styles.fieldWrapper}>
                                <Text style={styles.fieldLabel}>Description</Text>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Provide additional details..."
                                    placeholderTextColor="#AAA"
                                    value={description}
                                    onChangeText={setDescription}
                                    textAlignVertical="top"
                                />
                            </View>

                        </ScrollView>

                        {/* Modal Footer */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={submitting}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <Text style={styles.submitBtnText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>
        </MainLayout>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    unifiedContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        overflow: 'hidden',
        marginBottom: 10,
        padding: 20
    },
    // Page Header
    pageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        gap: 10,
        borderRadius: 12,
    },
    pageHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 1,
    },
    pageHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'flex-end',
    },
    filterChipRow: {
        flexDirection: 'row',
        gap: 8,
        paddingRight: 4,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D0D0D0',
        backgroundColor: '#F8F9FA',
    },
    filterChipActive: {
        backgroundColor: '#002D52',
        borderColor: '#002D52',
    },
    filterChipText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '500',
    },
    filterChipTextActive: {
        color: '#FFF',
    },
    pageHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1C1E',
    },
    countBadge: {
        backgroundColor: '#E8EDF2',
        borderRadius: 10,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#002D52',
    },
    regularizeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#002D52',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    regularizeBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },

    // List
    listScroll: { flex: 1 },
    listContent: { gap: 12, paddingBottom: 24 },
    centeredLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 8,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
    },
    emptySubText: {
        fontSize: 13,
        color: '#BBB',
        textAlign: 'center',
        paddingHorizontal: 20,
    },

    // Card
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
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    cardDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardDate: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    cardBody: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 6,
    },
    cardField: {
        minWidth: 130,
        flex: 1,
    },
    cardFieldLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '500',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    cardFieldValue: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    cardDescription: {
        fontSize: 12,
        color: '#777',
        marginTop: 6,
        fontStyle: 'italic',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: '100%',
        maxWidth: 580,
        maxHeight: '90%',
        ...Platform.select({
            web: { boxShadow: '0 10px 40px rgba(0,0,0,0.2)' },
            default: { elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 15 },
        }),
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    closeBtn: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 10,
    },

    // Form layout
    formRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    formCol: {
        flex: 1,
        minWidth: 200,
    },
    fieldWrapper: {
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    required: {
        color: '#E53935',
    },
    textInput: {
        height: 40,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        paddingHorizontal: 10,
        fontSize: 14,
        color: '#1A1C1E',
        backgroundColor: '#F8F9FA',
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 14,
        color: '#1A1C1E',
        backgroundColor: '#F8F9FA',
        minHeight: 80,
    },
    readonlyField: {
        height: 40,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: '#F0F0F0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    readonlyText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '600',
    },

    // Native select (reason type on mobile)
    nativeSelect: {
        height: 40,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: '#F8F9FA',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    nativeSelectValue: {
        fontSize: 14,
        color: '#1A1C1E',
        flex: 1,
    },
    nativeSelectPlaceholder: {
        fontSize: 14,
        color: '#AAA',
        flex: 1,
    },
    nativePickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    nativePickerSheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        paddingBottom: 36,
    },
    nativePickerTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1C1E',
        marginBottom: 16,
    },
    nativePickerOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    nativePickerOptionText: {
        fontSize: 15,
        color: '#333',
    },
    nativePickerOptionActive: {
        color: '#002D52',
        fontWeight: '600',
    },

    // Buttons
    cancelBtn: {
        paddingHorizontal: 20,
        paddingVertical: 9,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D0D0D0',
    },
    cancelBtnText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    submitBtn: {
        paddingHorizontal: 24,
        paddingVertical: 9,
        borderRadius: 6,
        backgroundColor: '#002D52',
        minWidth: 90,
        alignItems: 'center',
    },
    submitBtnText: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600',
    },
});

export default RegularizationScreen;
