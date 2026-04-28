// Wall Photo Component
import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { PolaroidBundle } from '../lib/types';
import { formatDateForDisplay } from '../lib/polaroid';

interface WallPhotoProps {
  bundle: PolaroidBundle;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;

export function WallPhoto({ bundle, onPress }: WallPhotoProps) {
  const date = new Date(bundle.wallDate || bundle.createdAt);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.95}>
      {/* Date header */}
      <View style={styles.dateHeader}>
        <Text style={styles.dayName}>{dayName}</Text>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>
      
      {/* Polaroid photo */}
      <View style={styles.polaroid}>
        <View style={styles.photoFrame}>
          <Image
            source={{ uri: bundle.imageUri }}
            style={styles.photo}
            contentFit="cover"
          />
        </View>
        
        {/* Bottom margin with watermark */}
        <View style={styles.bottomMargin}>
          <Text style={styles.watermark}>
            {bundle.sensorData.gps.latitude.toFixed(4)}, {bundle.sensorData.gps.longitude.toFixed(4)}
          </Text>
          <Text style={styles.watermark}>UIN: {bundle.uin}</Text>
          
          {bundle.diary && (
            <Text style={styles.diary}>{bundle.diary}</Text>
          )}
        </View>
      </View>
      
      {/* Verification badge */}
      <View style={styles.verifiedBadge}>
        <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
        <Text style={styles.verifiedText}>PHYSICALLY VERIFIED</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    alignItems: 'center',
  },
  dateHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 20,
    color: '#1e293b',
    fontWeight: '600',
    marginTop: 4,
  },
  polaroid: {
    width: CARD_WIDTH,
    backgroundColor: '#fefefe',
    borderRadius: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  photoFrame: {
    width: CARD_WIDTH - 32,
    height: CARD_WIDTH - 32,
    borderRadius: 2,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  bottomMargin: {
    paddingTop: 12,
    alignItems: 'center',
  },
  watermark: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#3b82f6',
    letterSpacing: 0.5,
  },
  diary: {
    fontSize: 14,
    fontFamily: 'serif',
    color: '#1e40af',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  verifiedText: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
