import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProjectItem } from '../types';
import ProjectItemRow from './ProjectItemRow';
import QuickAddInput from './QuickAddInput';

interface ProjectHierarchyProps {
    data: ProjectItem[];
    level?: number;
    onAddChild: (parentId: string, type: 'project' | 'task' | 'subtask') => void;
    onEdit: (item: ProjectItem) => void;
    onView: (item: ProjectItem) => void;
    onDelete: (id: string, type: 'project' | 'task' | 'subtask') => void;
}

const ProjectHierarchy: React.FC<ProjectHierarchyProps> = ({
    data,
    level = 0,
    onAddChild,
    onEdit,
    onView,
    onDelete,
}) => {
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedNodes((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <View style={styles.container}>
            {data.map((item) => (
                <View key={item.id}>
                    <ProjectItemRow
                        item={item}
                        level={level}
                        isExpanded={!!expandedNodes[item.id]}
                        onToggleExpand={() => toggleExpand(item.id)}
                        onAddChild={() => onAddChild(item.id, item.type === 'project' ? 'task' : 'subtask')}
                        onEdit={onEdit}
                        onView={onView}
                        onDelete={(id) => onDelete(id, item.type)}
                    />

                    {expandedNodes[item.id] && item.children && item.children.length > 0 && (
                        <ProjectHierarchy
                            data={item.children}
                            level={level + 1}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onView={onView}
                            onDelete={onDelete}
                        />
                    )}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
});

export default ProjectHierarchy;
