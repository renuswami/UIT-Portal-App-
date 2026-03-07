import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectItem, ProjectStatus } from '../types';

interface ProjectEditDrawerProps {
    visible: boolean;
    item: ProjectItem | null;
    onClose: () => void;
    onSave: (updatedItem: ProjectItem) => void;
}

const ProjectEditDrawer: React.FC<ProjectEditDrawerProps> = ({ visible, item, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [status, setStatus] = useState<ProjectStatus>('--None--');
    const [progress, setProgress] = useState('0');

    useEffect(() => {
        if (item) {
            setTitle(item.type === 'project' ? item.name || '' : item.taskName || '');
            setStatus(item.status);
            setProgress(item.progress?.toString() || '0');
        }
    }, [item]);

    const handleSave = () => {
        if (item) {
            onSave({
                ...item,
                ...(item.type === 'project' ? { name: title } : { taskName: title }),
                status,
                progress: item.type === 'project' ? parseInt(progress) : item.progress,
            });
            onClose();
        }
    };

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />
                <View style={styles.drawer}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Edit {item.type === 'project' ? 'Project' : 'Task'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#1A1C1E" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        <View style={styles.field}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter title"
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Status</Text>
                            <View style={styles.statusGrid}>
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

                        {item.type === 'project' && (
                            <View style={styles.field}>
                                <Text style={styles.label}>Progress (%)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={progress}
                                    onChangeText={setProgress}
                                    keyboardType="numeric"
                                    placeholder="0-100"
                                />
                            </View>
                        )}

                        <View style={styles.field}>
                            <Text style={styles.label}>Assignee</Text>
                            <View style={styles.assigneePlaceholder}>
                                <Ionicons name="person-circle-outline" size={32} color="#8E8E93" />
                                <Text style={styles.assigneeName}>
                                    {item.type === 'project' ? item.owner || 'Unassigned' : item.assignedTo || 'Unassigned'}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
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
        justifyContent: 'flex-end',
        ...Platform.select({
            web: {
                justifyContent: 'center',
                alignItems: 'center',
            }
        })
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    drawer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        width: '100%',
        ...Platform.select({
            web: {
                width: 500,
                height: 600,
                borderRadius: 20,
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }
        })
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    field: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1A1C1E',
    },
    statusGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
    },
    statusOptionActive: {
        borderColor: '#0A84FF',
        backgroundColor: '#0A84FF10',
    },
    statusOptionText: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    statusOptionTextActive: {
        color: '#0A84FF',
        fontWeight: '600',
    },
    assigneePlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F3F6F9',
        padding: 12,
        borderRadius: 10,
    },
    assigneeName: {
        fontSize: 16,
        color: '#1A1C1E',
        fontWeight: '500',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: '#F3F6F9',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#8E8E93',
        fontWeight: '600',
    },
    saveButton: {
        flex: 2,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: '#0A84FF',
    },
    saveButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default ProjectEditDrawer;
