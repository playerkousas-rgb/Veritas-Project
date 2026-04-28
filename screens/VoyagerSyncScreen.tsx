// Voyager Sync Screen - For Distant Friends
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { createSyncSeed, activateSyncSeed, verifyTimeSync, completeVoyagerSync, type SyncState } from '../lib/voyager';
import { getIdentity } from '../lib/identity';
import { getPublicKey } from '../lib/crypto';
import { t } from '../lib/i18n';

interface VoyagerSyncScreenProps {
  onClose: () => void;
  onComplete: () => void;
}

export function VoyagerSyncScreen({ onClose, onComplete }: VoyagerSyncScreenProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'syncing'>('select');
  const [seedCode, setSeedCode] = useState('');
  const [targetUIN, setTargetUIN] = useState('');
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    partnerUIN: null,
    progress: 0,
    timeRemaining: 60,
    phase: 'idle',
  });
  const [identity, setIdentity] = useState<{ uin: string } | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    loadIdentity();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);
  
  async function loadIdentity() {
    const id = await getIdentity();
    setIdentity(id);
  }
  
  async function handleCreateSeed() {
    if (!targetUIN.trim()) return;
    
    try {
      const seed = await createSyncSeed(targetUIN.trim());
      setSeedCode(seed.seedCode);
      setMode('create');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to create seed:', error);
    }
  }
  
  async function handleJoinSync() {
    if (!seedCode.trim()) return;
    
    try {
      const seed = await activateSyncSeed(seedCode.trim());
      if (seed) {
        setTargetUIN(seed.creatorUIN);
        startSyncSession(seed.creatorUIN, seed.creatorPublicKey);
      }
    } catch (error) {
      console.error('Failed to join sync:', error);
    }
  }
  
  function startSyncSession(partnerUIN: string, partnerPublicKey: string) {
    setSyncState({
      isSyncing: true,
      partnerUIN,
      progress: 0,
      timeRemaining: 60,
      phase: 'waiting',
    });
    setMode('syncing');
    
    // Start 60-second countdown
    countdownRef.current = setInterval(() => {
      setSyncState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          clearInterval(countdownRef.current!);
          return { ...prev, timeRemaining: 0, phase: 'failed' };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);
  }
  
  async function handleLongPressSync() {
    if (!syncState.partnerUIN) return;
    
    setSyncState(prev => ({ ...prev, phase: 'longpress' }));
    
    // Animate progress
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(async () => {
      // Verify time sync
      const localTime = Date.now();
      const publicKey = await getPublicKey();
      
      if (publicKey) {
        await completeVoyagerSync(syncState.partnerUIN!, publicKey);
        
        if (countdownRef.current) clearInterval(countdownRef.current);
        
        setSyncState(prev => ({ ...prev, phase: 'completed' }));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    });
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('voyagerSync')}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {mode === 'select' && (
        <View style={styles.content}>
          <Ionicons name="git-compare-outline" size={48} color="#0000FF" />
          <Text style={styles.title}>{t('voyagerSync')}</Text>
          <Text style={styles.desc}>
            「地理是限制，但同步是意志。」
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={() => setMode('create')}>
            <Text style={styles.buttonText}>創建同步碼</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => setMode('join')}>
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>輸入同步碼</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {mode === 'create' && (
        <View style={styles.content}>
          <Text style={styles.label}>對方 UIN</Text>
          <TextInput
            style={styles.input}
            value={targetUIN}
            onChangeText={setTargetUIN}
            placeholder="輸入對方的 8 位 UIN"
            placeholderTextColor="#9CA3AF"
            maxLength={8}
            keyboardType="number-pad"
          />
          
          {seedCode ? (
            <View style={styles.seedDisplay}>
              <Text style={styles.seedLabel}>同步碼</Text>
              <Text style={styles.seedCode}>{seedCode}</Text>
              <Text style={styles.seedHint}>將此碼發送給對方</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleCreateSeed}>
              <Text style={styles.buttonText}>生成同步碼</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {mode === 'join' && (
        <View style={styles.content}>
          <Text style={styles.label}>同步碼</Text>
          <TextInput
            style={styles.input}
            value={seedCode}
            onChangeText={setSeedCode}
            placeholder="輸入 6 位同步碼"
            placeholderTextColor="#9CA3AF"
            maxLength={6}
            keyboardType="number-pad"
          />
          
          <TouchableOpacity style={styles.button} onPress={handleJoinSync}>
            <Text style={styles.buttonText}>加入同步</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {mode === 'syncing' && (
        <View style={styles.content}>
          <Text style={styles.syncingTitle}>
            {t('syncingWith')} {syncState.partnerUIN}
          </Text>
          
          <Text style={styles.countdown}>
            {syncState.timeRemaining}s
          </Text>
          
          {syncState.phase === 'waiting' && (
            <TouchableOpacity
              style={styles.syncButton}
              onLongPress={handleLongPressSync}
              delayLongPress={100}
            >
              <Text style={styles.syncButtonText}>{t('longPressToSync')}</Text>
            </TouchableOpacity>
          )}
          
          {syncState.phase === 'longpress' && (
            <View style={styles.progressContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          )}
          
          {syncState.phase === 'completed' && (
            <>
              <Ionicons name="checkmark-circle" size={64} color="#0000FF" />
              <Text style={styles.completedText}>{t('syncComplete')}</Text>
            </>
          )}
          
          {syncState.phase === 'failed' && (
            <>
              <Ionicons name="close-circle" size={64} color="#EF4444" />
              <Text style={styles.failedText}>{t('syncFailed')}</Text>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#000000',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'monospace',
    color: '#000000',
    marginTop: 24,
    letterSpacing: 1,
  },
  desc: {
    fontSize: 12,
    fontFamily: 'serif',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
    maxWidth: 280,
  },
  label: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#000000',
    padding: 16,
    fontSize: 24,
    fontFamily: 'monospace',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#000000',
    padding: 16,
    paddingHorizontal: 48,
    marginTop: 12,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  buttonTextSecondary: {
    color: '#000000',
  },
  seedDisplay: {
    alignItems: 'center',
    marginTop: 24,
  },
  seedLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
  seedCode: {
    fontSize: 36,
    fontFamily: 'monospace',
    color: '#0000FF',
    letterSpacing: 8,
    marginTop: 12,
  },
  seedHint: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginTop: 12,
  },
  syncingTitle: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#000000',
    marginBottom: 24,
  },
  countdown: {
    fontSize: 48,
    fontFamily: 'monospace',
    color: '#0000FF',
    marginBottom: 24,
  },
  syncButton: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#000000',
    textAlign: 'center',
  },
  progressContainer: {
    width: 200,
    height: 8,
    backgroundColor: '#E5E5E5',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0000FF',
  },
  completedText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#0000FF',
    marginTop: 16,
  },
  failedText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#EF4444',
    marginTop: 16,
  },
});
