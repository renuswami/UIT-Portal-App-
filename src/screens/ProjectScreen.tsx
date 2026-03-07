import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Platform, ActivityIndicator, Alert, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MainLayout from '../components/layout/MainLayout';
import ProjectHierarchy from '../features/projects/components/ProjectHierarchy';
import ProjectDetailPanel from '../features/projects/components/ProjectDetailPanel';
import ProjectCreateModal from '../features/projects/components/ProjectCreateModal';
import { ProjectItem } from '../features/projects/types';
import { projectService } from '../features/projects/project.service';

const ProjectScreen = () => {
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<ProjectItem | null>(null);
    const [panelMode, setPanelMode] = useState<'view' | 'edit'>('view');
    const [isPanelVisible, setIsPanelVisible] = useState(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [leftWidthAnim] = useState(new Animated.Value(100));

    useEffect(() => {
        Animated.timing(leftWidthAnim, {
            toValue: isPanelVisible ? 60 : 100,
            duration: 600,
            useNativeDriver: false,
        }).start();
    }, [isPanelVisible]);

    const loadData = async () => {
        console.log('[ProjectScreen] loadData started');
        setIsLoading(true);
        try {
            const data = await projectService.fetchProjectsHierarchy();
            console.log(`[ProjectScreen] Received ${data.length} root items`);
            setProjects(data);
        } catch (error: any) {
            console.error('[ProjectScreen] loadData failed:', error);
            Alert.alert('Error', error.message || 'Failed to load projects');
        } finally {
            setIsLoading(false);
            console.log('[ProjectScreen] loadData finished');
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddChild = async (parentId: string, type: ProjectItem['type'], name: string) => {
        try {
            const isSubtask = type === 'subtask';
            const newItemData: Partial<ProjectItem> = {
                status: '--None--',
                parentId,
                ...(type === 'project' ? { name } : { taskName: name, priority: 'Medium' })
            };

            if (type === 'project') {
                await projectService.createProject(newItemData);
            } else {
                await projectService.createTask(newItemData, isSubtask);
            }
            loadData(); // Refresh list
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create item');
        }
    };

    const handleUpdateItem = async (updatedItem: ProjectItem) => {
        try {
            await projectService.updateItem(updatedItem);
            setSelectedItem(updatedItem);
            loadData(); // Refresh list
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update item');
        }
    };

    const handleDeleteItem = async (id: string | undefined, type: string) => {
        if (!id) return;

        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item and all its children?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await projectService.deleteItem(id, type as any);
                            if (selectedItem?.id === id) {
                                setIsPanelVisible(false);
                                setSelectedItem(null);
                            }
                            loadData();
                        } catch (error: any) {
                            Alert.alert('Error', error.message || 'Failed to delete item');
                        }
                    }
                }
            ]
        );
    };

    const handleView = (item: ProjectItem) => {
        console.log('[ProjectScreen] handleView called with item:', item);
        setSelectedItem(item);
        setPanelMode('view');
        setIsPanelVisible(true);
    };

    const handleEdit = (item: ProjectItem) => {
        setSelectedItem(item);
        setPanelMode('edit');
        setIsPanelVisible(true);
    };

    const handleCreateProject = async (data: Partial<ProjectItem>) => {
        try {
            await projectService.createProject(data);
            loadData();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create project');
        }
    };

    return (
        <MainLayout title="Project Management" scrollable={false}>
            <View style={styles.container}>
                {isLoading && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#0A84FF" />
                        <Text style={styles.loaderText}>Loading Projects...</Text>
                    </View>
                )}
                <View style={[styles.mainLayout, { flexDirection: 'row' }]}>
                    {/* Left Section: Hierarchy */}
                    <Animated.View style={[
                        styles.leftSection,
                        {
                            width: leftWidthAnim.interpolate({
                                inputRange: [60, 100],
                                outputRange: ['60%', '100%']
                            })
                        }
                    ]}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Projects</Text>
                            </View>
                            <View>
                                <TouchableOpacity
                                    style={styles.newProjectButton}
                                    onPress={() => setIsCreateModalVisible(true)}
                                >
                                    <Ionicons name="add" size={20} color="#FFFFFF" />
                                    <Text style={styles.newProjectText}>New Project</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView style={styles.listContent} showsVerticalScrollIndicator={false}>
                            {projects.length === 0 && !isLoading ? (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="folder-open-outline" size={48} color="#E5E5EA" />
                                    <Text style={styles.emptyText}>No projects found</Text>
                                    <TouchableOpacity style={styles.retryButton} onPress={loadData}>
                                        <Text style={styles.retryText}>Reload Data</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <ProjectHierarchy
                                    data={projects}
                                    onAddChild={(parentId, type) => {
                                        const name = prompt(`Enter ${type} name:`);
                                        if (name) handleAddChild(parentId, type, name);
                                    }}
                                    onEdit={handleEdit}
                                    onView={handleView}
                                    onDelete={(id, type) => handleDeleteItem(id, type)}
                                />
                            )}
                        </ScrollView>
                    </Animated.View>

                    {/* Right Section: Detail Panel Overlay (40%) */}
                    <ProjectDetailPanel
                        item={selectedItem}
                        visible={isPanelVisible}
                        initialMode={panelMode}
                        onClose={() => setIsPanelVisible(false)}
                        onSave={handleUpdateItem}
                    />
                </View>

                {/* Create Modal */}
                <ProjectCreateModal
                    visible={isCreateModalVisible}
                    onClose={() => setIsCreateModalVisible(false)}
                    onSave={handleCreateProject}
                />
            </View>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    mainLayout: {
        flex: 1,
        flexDirection: 'row',
    },
    leftSection: {
        borderRightWidth: 1,
        borderRightColor: '#F0F0F0',
        height: '100%',
    },
    rightSection: {
        flex: 0.4,
        backgroundColor: '#FFFFFF',
    },
    header: {
        padding: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    newProjectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f1a51',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4,
    },
    newProjectText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 12,
    },
    listContent: {
        flex: 1,
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 12,
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8E8E93',
        fontWeight: '500',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#0A84FF',
        borderRadius: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ProjectScreen;
