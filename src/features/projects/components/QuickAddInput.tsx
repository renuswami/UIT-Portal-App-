import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickAddInputProps {
    placeholder: string;
    onAdd: (title: string) => void;
}

const QuickAddInput: React.FC<QuickAddInputProps> = ({ placeholder, onAdd }) => {
    const [title, setTitle] = useState('');

    const handleAdd = () => {
        if (title.trim()) {
            onAdd(title.trim());
            setTitle('');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#8E8E93"
                onSubmitEditing={handleAdd}
            />
            <TouchableOpacity
                style={[styles.addButton, !title.trim() && styles.addButtonDisabled]}
                onPress={handleAdd}
                disabled={!title.trim()}
            >
                <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingRight: 16,
    },
    input: {
        flex: 1,
        height: 36,
        backgroundColor: '#F3F6F9',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        color: '#1A1C1E',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#0A84FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    addButtonDisabled: {
        backgroundColor: '#E5E5EA',
    },
});

export default QuickAddInput;
