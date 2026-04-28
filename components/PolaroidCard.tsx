// Polaroid Card Component
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { PolaroidBundle } from '../lib/types';
import { formatDateForDisplay, formatTimeForDisplay } from '../lib/polaroid';

interface PolaroidCardProps {
  bundle: PolaroidBundle;
  showVerification?: boolean;
  isVerified?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PolaroidCard({
  bundle,
  showVerification = true,
  isVerified = true,
  onPress,
  size = 'medium',
}: PolaroidCardProps) {
  const cardSize = {
    small: { width: SCREEN_WIDTH * 0.4, height: SCREEN_WIDTH * 0.5 },
    medium: { width: SCREEN_WIDTH * 0.7, height: SCREEN_WIDTH * 0.85 },
    large: { width: SCREEN_WIDTH * 0.85, height: SCREEN_WIDTH * 1.05 },
  }[size];
  
  const photoSize = {
    small: cardSize.width - 20,
    medium: cardSize.width - 30,
    large: cardSize.width - 40,
  }[size];
  
  const fontSize = size === 'small' ? 8 : size === 'medium' ? 10 : 12;
  
  return (
    <View style={[styles.container, cardSize]} onTouchEnd={onPress}>
      {/* White polaroid frame */}
      <View style={styles.frame}>
        {/* Photo area */}
        <View style={[styles.photoArea, { width: photoSize, height: photoSize }]}>
          <Image
            source={{ uri: bundle.imageUri }}
            style={styles.photo}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
          
          {/* Verification badge */}
          {showVerification && (
            <View style={[
              styles.verificationBadge,
              { backgroundColor: isVerified ? '#22c55e' : '#ef4444' }
            ]}>
              <Ionicons
                name={isVerified ? 'checkmark-circle' : 'close-circle'}
                size={12}
                color="white"
              />
            </View>
          )}
        </View>
        
        {/* Bottom margin with watermark */}
        <View style={styles.bottomMargin}>
          {/* Date/Time/GPS watermark */}
          <Text style={[styles.watermark, { fontSize }]}>
            {formatDateForDisplay(bundle.createdAt)} / {formatTimeForDisplay(bundle.createdAt)}
          </Text>
          <Text style={[styles.watermark, { fontSize }]}>
            {bundle.sensorData.gps.latitude.toFixed(4)}, {bundle.sensorData.gps.longitude.toFixed(4)}
          </Text>
          <Text style={[styles.watermark, { fontSize }]}>
            UIN: {bundle.uin}
          </Text>
          
          {/* Diary text */}
          {bundle.diary && (
            <Text style={[styles.diaryText, { fontSize: fontSize + 2 }]}>
              {bundle.diary}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fafafa',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  frame: {
    flex: 1,
    backgroundColor: '#fefefe',
    borderRadius: 4,
    padding: 15,
    alignItems: 'center',
  },
  photoArea: {
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  verificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    padding: 2,
  },
  bottomMargin: {
    flex: 1,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermark: {
    fontFamily: 'monospace',
    color: '#3b82f6',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  diaryText: {
    fontFamily: 'serif',
    color: '#1e40af',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
