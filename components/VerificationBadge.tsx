// Verification Badge Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VerificationResult } from '../lib/types';
import { getVerificationBadge } from '../lib/truthValidation';

interface VerificationBadgeProps {
  result: VerificationResult;
  size?: 'small' | 'medium' | 'large';
}

export function VerificationBadge({ result, size = 'medium' }: VerificationBadgeProps) {
  const badge = getVerificationBadge(result);
  
  const sizes = {
    small: { icon: 12, text: 8, padding: 4 },
    medium: { icon: 16, text: 10, padding: 6 },
    large: { icon: 20, text: 12, padding: 8 },
  };
  
  const s = sizes[size];
  
  return (
    <View style={[styles.container, { backgroundColor: badge.color }]}>
      <Ionicons name={badge.icon as any} size={s.icon} color="white" />
      <Text style={[styles.text, { fontSize: s.text }]}>{badge.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  text: {
    color: 'white',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
