// Handwritten Input Component
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MAX_CHARS = 20;

interface HandwrittenInputProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export function HandwrittenInput({
  onSubmit,
  onCancel,
  placeholder = 'Write your memory...',
}: HandwrittenInputProps) {
  const [text, setText] = useState('');
  const charsRemaining = MAX_CHARS - text.length;
  const isValid = text.length > 0 && text.length <= MAX_CHARS;
  
  const handleSubmit = () => {
    if (isValid) {
      onSubmit(text);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Memory</Text>
        <Text style={styles.charCount}>{charsRemaining} chars left</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          maxLength={MAX_CHARS}
          multiline={false}
          autoFocus
          selectionColor="#3b82f6"
        />
      </View>
      
      <Text style={styles.warning}>
        ⚠️ Once written, text cannot be changed or deleted
      </Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Ionicons name="close" size={20} color="#64748b" />
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.submitText}>Write</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fefefe',
    borderRadius: 12,
    padding: 20,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  charCount: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  inputContainer: {
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  input: {
    fontSize: 18,
    color: '#1e40af',
    fontFamily: 'serif',
    fontStyle: 'italic',
    padding: 0,
  },
  warning: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 12,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    gap: 8,
  },
  cancelText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
});
