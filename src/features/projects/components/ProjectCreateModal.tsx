import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectItem, ProjectStatus } from '../types';

interface ProjectCreateModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: Partial<ProjectItem>) => void;
}

const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({ visible, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [status, setStatus] = useState<ProjectStatus>('--None--');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [account, setAccount] = useState('');
    const [budgetHours, setBudgetHours] = useState('');
    const [owner, setOwner] = useState('');
    const [description, setDescription] = useState('');

    const [errors, setErrors] = useState<{ name?: string }>({});

    const handleSave = () => {
        if (!name.trim()) {
            setErrors({ name: 'Complete this field.' });
            return;
        }

        onSave({
            name,
            status,
            startDate,
            endDate,
            account,
            budgetHours: parseInt(budgetHours) || 0,
            owner,
            description
        });

        // Reset form
        setName('');
        setStatus('--None--');
        setStartDate('');
        setEndDate('');
        setAccount('');
        setBudgetHours('');
        setOwner('');
        setDescription('');
        setErrors({});
        onClose();
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>New Project</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#1A1C1E" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <Text style={styles.requiredNote}>* = Required Information</Text>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Information</Text>

                            <View style={styles.formGrid}>
                                {/* Left Column */}
                                <View style={styles.column}>
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>
                                            <Text style={styles.requiredStar}>*</Text>Project Name
                                        </Text>
                                        <TextInput
                                            style={[styles.input, errors.name && styles.inputError]}
                                            value={name}
                                            onChangeText={(t) => { setName(t); setErrors({}); }}
                                        />
                                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                                    </View>

                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Start Date</Text>
                                        <Text style={styles.helpText}>Format: 31/12/2024</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={startDate}
                                            onChangeText={setStartDate}
                                            placeholder="DD/MM/YYYY"
                                        />
                                    </View>

                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Status</Text>
                                        <View style={styles.statusOptions}>
                                            {(['--None--', 'Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'] as ProjectStatus[]).map((s) => (
                                                <TouchableOpacity
                                                    key={s}
                                                    style={[styles.statusOption, status === s && styles.statusOptionActive]}
                                                    onPress={() => setStatus(s)}
                                                >
                                                    <Text style={[styles.statusOptionText, status === s && styles.statusOptionTextActive]}>
                                                        {s}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                {/* Right Column */}
                                <View style={styles.column}>
                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Account</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={account}
                                            onChangeText={setAccount}
                                        />
                                    </View>

                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>End Date</Text>
                                        <Text style={styles.helpText}>Format: 31/12/2024</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={endDate}
                                            onChangeText={setEndDate}
                                            placeholder="DD/MM/YYYY"
                                        />
                                    </View>

                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Budget Hours</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={budgetHours}
                                            onChangeText={setBudgetHours}
                                            keyboardType="numeric"
                                        />
                                    </View>

                                    <View style={styles.fieldContainer}>
                                        <Text style={styles.label}>Project Owner</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={owner}
                                            onChangeText={setOwner}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Full Width */}
                            <View style={[styles.fieldContainer, styles.fullWidth]}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 800,
        maxHeight: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        ...Platform.select({
            web: {
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            },
            default: {
                elevation: 10,
            }
        })
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 24,
    },
    requiredNote: {
        fontSize: 12,
        color: '#FF3B30',
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1C1E',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    formGrid: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        gap: 24,
    },
    column: {
        flex: 1,
        gap: 16,
    },
    fullWidth: {
        marginTop: 16,
    },
    fieldContainer: {
        width: '100%',
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#495057',
        marginBottom: 4,
    },
    requiredStar: {
        color: '#FF3B30',
    },
    helpText: {
        fontSize: 11,
        color: '#8E8E93',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        color: '#1A1C1E',
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            }
        })
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    statusOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
    },
    statusOptionActive: {
        borderColor: '#0A84FF',
        backgroundColor: '#0A84FF10',
    },
    statusOptionText: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
    statusOptionTextActive: {
        color: '#0A84FF',
        fontWeight: '600',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        backgroundColor: '#F8F9FA',
    },
    cancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#495057',
    },
    saveButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
        backgroundColor: '#0f1a51',
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ProjectCreateModal;
