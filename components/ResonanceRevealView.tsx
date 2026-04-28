// Resonance Reveal Component - Shows after development
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ResonanceReveal } from '../lib/resonance';
import { formatTimeDifference } from '../lib/resonance';
import { t } from '../lib/i18n';

interface ResonanceRevealViewProps {
  resonances: ResonanceReveal[];
  onAnimationEnd?: () => void;
}

export function ResonanceRevealView({ resonances, onAnimationEnd }: ResonanceRevealViewProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationEnd?.();
    });
  }, []);
  
  if (resonances.length === 0) return null;
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="radio-button-on" size={24} color="#0000FF" />
      </View>
      
      <Text style={styles.title}>{t('witnessedHere')}</Text>
      
      {resonances.map((resonance, index) => (
        <View key={index} style={styles.resonanceItem}>
          <Text style={styles.uin}>UIN: {resonance.theirUIN}</Text>
          <Text style={styles.time}>
            {formatTimeDifference(resonance.timeDifference)}{t('timeAgo')}
          </Text>
        </View>
      ))}
      
      <Text style={styles.philosophy}>
        「真理不應該被預知，只能被見證。」
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: '#0000FF',
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#0000FF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  resonanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  uin: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000000',
  },
  time: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
  philosophy: {
    fontSize: 10,
    fontFamily: 'serif',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
