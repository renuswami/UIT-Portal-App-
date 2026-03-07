import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BreadcrumbItem {
    id: string;
    title: string;
}

interface ProjectBreadcrumbsProps {
    items: BreadcrumbItem[];
    onNavigate: (id: string) => void;
}

const ProjectBreadcrumbs: React.FC<ProjectBreadcrumbsProps> = ({ items, onNavigate }) => {
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity onPress={() => onNavigate('root')} style={styles.item}>
                    <Ionicons name="home-outline" size={16} color="#8E8E93" />
                </TouchableOpacity>

                {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <Ionicons name="chevron-forward" size={14} color="#C7C7CC" style={styles.separator} />
                        <TouchableOpacity onPress={() => onNavigate(item.id)} style={styles.item}>
                            <Text
                                style={[
                                    styles.text,
                                    index === items.length - 1 && styles.activeText
                                ]}
                                numberOfLines={1}
                            >
                                {item.title}
                            </Text>
                        </TouchableOpacity>
                    </React.Fragment>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 48,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    scrollContent: {
        alignItems: 'center',
    },
    item: {
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    separator: {
        marginHorizontal: 4,
    },
    text: {
        fontSize: 14,
        color: '#8E8E93',
        fontWeight: '500',
    },
    activeText: {
        color: '#1A1C1E',
        fontWeight: '700',
    },
});

export default ProjectBreadcrumbs;
