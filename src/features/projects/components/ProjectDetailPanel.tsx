import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Dimensions, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectItem, ProjectStatus, TaskPriority } from '../types';

interface ProjectDetailPanelProps {
    item: ProjectItem | null;
    visible: boolean;
    initialMode?: 'view' | 'edit';
    onClose: () => void;
    onSave: (updatedItem: ProjectItem) => void;
}

const ProjectDetailPanel: React.FC<ProjectDetailPanelProps> = ({ item, visible, initialMode = 'view', onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<ProjectItem>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [slideAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            setIsEditing(initialMode === 'edit');
        }
        Animated.timing(slideAnim, {
            toValue: visible ? 1 : 0,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [Dimensions.get('window').width * 0.4, 0],
    });

    useEffect(() => {
        console.log('[ProjectDetailPanel] Received Item:', item, 'Visible:', visible);
        if (item) {
            setFormData({ ...item });
        }
    }, [item, visible]);

    const handleChange = (key: keyof ProjectItem, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        if (item) {
            onSave({ ...item, ...formData } as ProjectItem);
            onClose();
        }
    };

    const renderField = (label: string, value: string | number | undefined, key: keyof ProjectItem, halfWidth: boolean = true) => (
        <View style={[styles.fieldContainer, halfWidth && styles.fieldHalf]}>
            <Text style={styles.label}>{label}</Text>
            {isEditing ? (
                <TextInput
                    style={styles.input}
                    value={value?.toString() || ''}
                    onChangeText={(text) => handleChange(key, key === 'budgetHours' || key === 'estimatedHours' ? parseInt(text) || 0 : text)}
                    placeholder={`Enter ${label}`}
                />
            ) : (
                <Text style={styles.valueText}>{value?.toString() || '--'}</Text>
            )}
        </View>
    );

    return (
        <Animated.View
            style={[styles.container, { transform: [{ translateX }] }]}
            pointerEvents={visible ? 'auto' : 'none'}
        >
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Ionicons
                        name={item?.type === 'project' ? 'folder' : 'document-text'}
                        size={20}
                        color={item?.type === 'project' ? '#FF7A00' : '#0A84FF'}
                    />
                    <Text style={styles.headerTitle}>{item?.type === 'project' ? 'Project Details' : 'Task Details'}</Text>
                </View>
                <View style={styles.headerRight}>
                    {!isEditing && (
                        <Pressable
                            onPress={() => setIsEditing(true)}
                            style={({ pressed, hovered }: any) => [
                                styles.iconButton,
                                (pressed || hovered) && styles.iconButtonHovered
                            ]}
                        >
                            <Ionicons name="pencil-outline" size={20} color="#1A1C1E" />
                        </Pressable>
                    )}
                    <Pressable
                        onPress={onClose}
                        style={({ pressed, hovered }: any) => [
                            styles.iconButton,
                            (pressed || hovered) && styles.iconButtonHovered
                        ]}
                    >
                        <Ionicons name="close" size={20} color="#1A1C1E" />
                    </Pressable>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.formGrid}>
                    {item?.type === 'project' ? (
                        <>
                            {renderField('Project Name', formData.name, 'name', false)}
                            <View style={styles.row}>
                                {renderField('Start Date', formData.startDate, 'startDate')}
                                {renderField('End Date', formData.endDate, 'endDate')}
                            </View>
                            <View style={styles.row}>
                                {renderField('Budget Hours', formData.budgetHours, 'budgetHours')}
                                {renderField('Project Owner', formData.owner, 'owner')}
                            </View>
                        </>
                    ) : (
                        <>
                            {renderField('Task Name', formData.taskName, 'taskName', false)}
                            <View style={styles.row}>
                                {renderField('Priority', formData.priority, 'priority')}
                                {renderField('Assigned To', formData.assignedTo, 'assignedTo')}
                            </View>
                            <View style={styles.row}>
                                {renderField('Estimated Hours', formData.estimatedHours, 'estimatedHours')}
                                {renderField('Due Date', formData.dueDate, 'dueDate')}
                            </View>
                        </>
                    )}

                    <View style={styles.statusSection}>
                        <Text style={styles.label}>Status</Text>
                        {isEditing ? (
                            <View style={styles.statusOptions}>
                                {(['--None--', 'Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'] as ProjectStatus[]).map((s) => (
                                    <TouchableOpacity
                                        key={s}
                                        style={[styles.statusOption, formData.status === s && styles.statusOptionActive]}
                                        onPress={() => handleChange('status', s)}
                                    >
                                        <Text style={[styles.statusOptionText, formData.status === s && styles.statusOptionTextActive]}>
                                            {s}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={[styles.statusOption, styles.statusOptionActive, { alignSelf: 'flex-start' }]}>
                                <Text style={styles.statusOptionTextActive}>{formData.status || '--None--'}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Description</Text>
                        {isEditing ? (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={formData.description || ''}
                                onChangeText={(text) => handleChange('description', text)}
                                placeholder="Add detailed description..."
                                multiline
                                numberOfLines={4}
                            />
                        ) : (
                            <Text style={styles.valueText}>{formData.description || '--'}</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            {isEditing && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsEditing(false); setFormData({ ...item }); }}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '40%',
        backgroundColor: '#FFFFFF',
        borderLeftWidth: 1,
        borderLeftColor: '#F0F0F0',
        elevation: 5,
        zIndex: 1000,
        ...Platform.select({
            web: {
                boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.05)',
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    iconButtonHovered: {
        backgroundColor: '#F0F0F0',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    formGrid: {
        gap: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    fieldContainer: {
        width: '100%',
    },
    fieldHalf: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: '#1A1C1E',
        backgroundColor: '#F9FAFB',
    },
    valueText: {
        fontSize: 14,
        color: '#1A1C1E',
        fontWeight: '500',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    statusSection: {
        marginTop: 10,
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
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#F3F6F9',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
    },
    saveButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        backgroundColor: '#0f1a51',
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ProjectDetailPanel;
