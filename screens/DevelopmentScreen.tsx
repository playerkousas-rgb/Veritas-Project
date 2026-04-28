// Development Screen - 15 Second Darkroom
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DevelopmentView } from '../components/DevelopmentView';
import type { PolaroidBundle } from '../lib/types';

interface DevelopmentScreenProps {
  bundle: PolaroidBundle;
  onComplete: (bundle: PolaroidBundle) => void;
}

export function DevelopmentScreen({ bundle, onComplete }: DevelopmentScreenProps) {
  const [isComplete, setIsComplete] = useState(false);
  
  function handleComplete() {
    setIsComplete(true);
    onComplete(bundle);
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <DevelopmentView bundle={bundle} onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
});
