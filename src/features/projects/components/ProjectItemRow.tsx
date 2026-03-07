import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectItem, STATUS_COLORS, PRIORITY_COLORS } from '../types';

interface ProjectItemRowProps {
    item: ProjectItem;
    level: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onAddChild: (parentId: string) => void;
    onEdit: (item: ProjectItem) => void;
    onView: (item: ProjectItem) => void;
    onDelete: (id: string) => void;
}

const ProjectItemRow: React.FC<ProjectItemRowProps> = ({
    item,
    level,
    isExpanded,
    onToggleExpand,
    onAddChild,
    onEdit,
    onView,
    onDelete,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const hasChildren = item.children && item.children.length > 0;
    const indentation = level * 28;

    const renderStatusBadge = () => (
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
        </View>
    );

    const renderPriorityBadge = () => {
        if (item.type === 'project' || !item.priority) return null;
        return (
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] + '15' }]}>
                <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>{item.priority}</Text>
            </View>
        );
    };

    const renderFields = () => {
        if (item.type === 'project') {
            return (
                <View style={styles.fieldsContainer}>
                    <View style={styles.fieldItem}>
                        <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                        <Text style={styles.fieldText}>{item.startDate} - {item.endDate}</Text>
                    </View>
                    <View style={styles.fieldItem}>
                        <Ionicons name="time-outline" size={12} color="#8E8E93" />
                        <Text style={styles.fieldText}>{item.budgetHours}h</Text>
                    </View>
                    <View style={styles.fieldItem}>
                        <Ionicons name="person-outline" size={12} color="#8E8E93" />
                        <Text style={styles.fieldText}>{item.owner}</Text>
                    </View>
                </View>
            );
        } else {
            return (
                <View style={styles.fieldsContainer}>
                    <View style={styles.fieldItem}>
                        <Ionicons name="calendar-outline" size={12} color="#8E8E93" />
                        <Text style={styles.fieldText}>{item.dueDate}</Text>
                    </View>
                    <View style={styles.fieldItem}>
                        <Ionicons name="time-outline" size={12} color="#8E8E93" />
                        <Text style={styles.fieldText}>{item.estimatedHours}h</Text>
                    </View>
                    <View style={styles.fieldItem}>
                        <Text style={styles.fieldText}>@{item.assignedTo}</Text>
                    </View>
                </View>
            );
        }
    };

    return (
        <View
            style={[
                styles.rowWrapper,
                isHovered && styles.rowHovered
            ]}
            onPointerEnter={() => Platform.OS === 'web' && setIsHovered(true)}
            onPointerLeave={() => Platform.OS === 'web' && setIsHovered(false)}
        >
            {/* Indentation & Scaffolding */}
            {level > 0 && (
                <View style={[styles.scaffoldLines, { left: indentation - 14 }]} />
            )}

            <View style={[styles.rowContent, { paddingLeft: indentation }]}>
                {/* Expand/Collapse Toggle */}
                <TouchableOpacity
                    onPress={onToggleExpand}
                    disabled={!hasChildren && item.type === 'subtask'}
                    style={styles.expandIconContainer}
                >
                    {(hasChildren || item.type !== 'subtask') ? (
                        <Ionicons
                            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                            size={16}
                            color="#8E8E93"
                        />
                    ) : (
                        <View style={{ width: 16 }} />
                    )}
                </TouchableOpacity>

                {/* Main Content Area */}
                <View style={styles.mainInfo}>
                    <View style={styles.titleRow}>
                        <Ionicons
                            name={item.type === 'project' ? 'folder' : (item.type === 'task' ? 'list' : 'document-text')}
                            size={16}
                            color={item.type === 'project' ? '#FF7A00' : (item.type === 'task' ? '#0A84FF' : '#8E8E93')}
                            style={styles.itemIcon}
                        />
                        <Text style={styles.title} numberOfLines={1}>
                            {item.type === 'project' ? item.name : item.taskName}
                        </Text>
                    </View>
                </View>

                {/* Metadata & Badges */}
                <View style={styles.badgesSection}>
                    {renderPriorityBadge()}
                    {renderStatusBadge()}
                </View>

                {/* Action Group */}
                <View style={styles.actionGroup}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => onView(item)}>
                        <Ionicons name="information-circle-outline" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                    {item.type !== 'subtask' && (
                        <TouchableOpacity style={styles.actionButton} onPress={() => onAddChild(item.id)}>
                            <Ionicons name="add-circle-outline" size={20} color="#0A84FF" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(item)}>
                        <Ionicons name="create-outline" size={20} color="#8E8E93" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    rowWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
        minHeight: 48,
        paddingVertical: 4,
        justifyContent: 'center',
    },
    rowHovered: {
        backgroundColor: '#F8F9FA',
    },
    rowContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 16,
    },
    scaffoldLines: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1.5,
        backgroundColor: '#E5E5EA',
    },
    expandIconContainer: {
        width: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainInfo: {
        flex: 1,
        marginRight: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemIcon: {
        marginRight: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1C1E',
    },
    fieldsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    fieldItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    fieldText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    badgesSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 11,
        fontWeight: '700',
    },
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    actionButton: {
        padding: 4,
        marginHorizontal: 2,
    },
});

export default ProjectItemRow;
