// Echo Message Component - With Visual Fading
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { VerityMessage } from '../lib/messaging';

interface EchoMessageProps {
  message: VerityMessage;
  isUnresponded: boolean;
}

export function EchoMessage({ message, isUnresponded }: EchoMessageProps) {
  const [colorAnim] = useState(new Animated.Value(0));
  const hasStartedFade = useRef(false);
  
  useEffect(() => {
    if (!isUnresponded) return;
    
    // Check if within last hour of 24-hour decay
    const age = Date.now() - message.timestamp;
    const hoursRemaining = (24 * 60 * 60 * 1000 - age) / (60 * 60 * 1000);
    
    if (hoursRemaining <= 1 && !hasStartedFade.current) {
      hasStartedFade.current = true;
      
      // Start fading animation
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: hoursRemaining * 60 * 60 * 1000, // Fade over remaining time
        useNativeDriver: false,
      }).start();
    }
  }, [isUnresponded, message.timestamp]);
  
  // Interpolate color from blue to gray
  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#0000FF', '#D1D5DB'], // Blue to gray-white
  });
  
  const time = new Date(message.timestamp).toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.content, { color: isUnresponded ? textColor : '#000000' }]}>
        {message.content}
      </Animated.Text>
      <Text style={styles.time}>{time}</Text>
      
      {isUnresponded && (
        <Text style={styles.decayHint}>
          未被接住的觸碰正在消逝...
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  content: {
    fontSize: 16,
    fontFamily: 'serif',
    lineHeight: 24,
  },
  time: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9CA3AF',
    marginTop: 8,
  },
  decayHint: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
