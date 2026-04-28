// Development View - 15 Second Darkroom Animation
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { PolaroidBundle } from '../lib/types';

const DEVELOPMENT_TIME = 15000; // 15 seconds

interface DevelopmentViewProps {
  bundle: PolaroidBundle;
  onComplete: () => void;
}

export function DevelopmentView({ bundle, onComplete }: DevelopmentViewProps) {
  const [progress, setProgress] = useState(0);
  const [soundLoaded, setSoundLoaded] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(100)).current;
  
  useEffect(() => {
    loadSound();
    startDevelopment();
    
    return () => {
      unloadSound();
    };
  }, []);
  
  async function loadSound() {
    try {
      // In a real app, load actual sound file
      // const { sound } = await Audio.Sound.createAsync(
      //   require('../assets/sounds/develop.mp3')
      // );
      // soundRef.current = sound;
      // await sound.playAsync();
      setSoundLoaded(true);
    } catch (error) {
      console.log('Sound not loaded:', error);
    }
  }
  
  async function unloadSound() {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
    }
  }
  
  function startDevelopment() {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / DEVELOPMENT_TIME, 1);
      
      setProgress(newProgress);
      
      // Animate opacity and blur
      opacityAnim.setValue(newProgress);
      blurAnim.setValue(100 * (1 - newProgress));
      
      if (newProgress >= 1) {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }
  
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };
  
  const remainingTime = DEVELOPMENT_TIME * (1 - progress);
  
  return (
    <View style={styles.container}>
      {/* Darkroom overlay */}
      <View style={styles.darkroomOverlay}>
        {/* Photo developing animation */}
        <View style={styles.photoContainer}>
          <Animated.Image
            source={{ uri: bundle.imageUri }}
            style={[
              styles.photo,
              {
                opacity: opacityAnim,
              }
            ]}
            blurRadius={blurAnim}
          />
          
          {/* Chemical flow effect */}
          <Animated.View
            style={[
              styles.chemicalFlow,
              {
                opacity: opacityAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.8, 0.4, 0],
                }),
              },
            ]}
          />
        </View>
        
        {/* Development info */}
        <View style={styles.infoContainer}>
          <Ionicons name="film-outline" size={32} color="#94a3b8" />
          <Text style={styles.title}>Developing...</Text>
          <Text style={styles.subtitle}>
            {formatTime(remainingTime)} remaining
          </Text>
          
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          
          <Text style={styles.hint}>
            Photo is being processed in the darkroom
          </Text>
        </View>
      </View>
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  darkroomOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  photoContainer: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1e293b',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  chemicalFlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e40af',
  },
  infoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#f1f5f9',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 8,
  },
  progressBar: {
    width: SCREEN_WIDTH * 0.6,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
});
