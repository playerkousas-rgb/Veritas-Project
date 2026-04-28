// Legacy Recovery Screen - 24 Word Mnemonic
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { generateMnemonic, storeMnemonicHash, verifyMnemonic, getLegacyState, formatMnemonic, RECOVERY_WARNING } from '../lib/legacy';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LegacyScreenProps {
  onComplete: () => void;
  isRecovery?: boolean;
}

export function LegacyScreen({ onComplete, isRecovery = false }: LegacyScreenProps) {
  const [step, setStep] = useState<'intro' | 'show' | 'verify' | 'done'>('intro');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [verifyInput, setVerifyInput] = useState<string[]>([]);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [legacyState, setLegacyState] = useState<{ hasMnemonic: boolean } | null>(null);
  
  useEffect(() => {
    checkState();
  }, []);
  
  async function checkState() {
    const state = await getLegacyState();
    setLegacyState(state);
  }
  
  function generateNew() {
    const words = generateMnemonic();
    setMnemonic(words);
    setVerifyInput(new Array(24).fill(''));
    setStep('show');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  
  async function confirmWritten() {
    if (!hasAgreed) {
      Alert.alert('警告', '請確認你已用紙筆抄寫助記詞。');
      return;
    }
    
    await storeMnemonicHash(mnemonic);
    setStep('done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  
  async function handleVerify() {
    const isValid = await verifyMnemonic(verifyInput);
    
    if (isValid) {
      setStep('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('驗證失敗', '助記詞不正確，請重新輸入。');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }
  
  const groups = formatMnemonic(mnemonic);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="key" size={48} color="#0000FF" />
          <Text style={styles.title}>物理繼承</Text>
        </View>
        
        {step === 'intro' && (
          <View style={styles.stepContent}>
            <Text style={styles.warningText}>{RECOVERY_WARNING}</Text>
            
            <TouchableOpacity style={styles.button} onPress={generateNew}>
              <Text style={styles.buttonText}>生成助記詞</Text>
            </TouchableOpacity>
            
            {isRecovery && (
              <TouchableOpacity 
                style={[styles.button, styles.buttonSecondary]} 
                onPress={() => setStep('verify')}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  我已有助記詞
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {step === 'show' && (
          <View style={styles.stepContent}>
            <Text style={styles.instruction}>
              請用紙筆抄寫以下 24 個詞，這是你唯一的恢復手段。
            </Text>
            
            <View style={styles.mnemonicContainer}>
              {groups.map((group, groupIndex) => (
                <View key={groupIndex} style={styles.mnemonicGroup}>
                  {group.map((word, wordIndex) => {
                    const globalIndex = groupIndex * 4 + wordIndex;
                    return (
                      <View key={wordIndex} style={styles.wordBox}>
                        <Text style={styles.wordNumber}>{globalIndex + 1}</Text>
                        <Text style={styles.wordText}>{word}</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.agreementButton}
              onPress={() => setHasAgreed(!hasAgreed)}
            >
              <View style={[styles.checkbox, hasAgreed && styles.checkboxChecked]}>
                {hasAgreed && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
              </View>
              <Text style={styles.agreementText}>
                我已用紙筆抄寫這 24 個詞
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, !hasAgreed && styles.buttonDisabled]}
              onPress={confirmWritten}
              disabled={!hasAgreed}
            >
              <Text style={styles.buttonText}>確認完成</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {step === 'done' && (
          <View style={styles.stepContent}>
            <Ionicons name="checkmark-circle" size={64} color="#0000FF" />
            <Text style={styles.doneTitle}>繼承已設定</Text>
            <Text style={styles.doneDesc}>
              請妥善保管你的助記詞。如果遺失，你的 UIN 與所有日記將永遠消失。
            </Text>
            
            <TouchableOpacity style={styles.button} onPress={onComplete}>
              <Text style={styles.buttonText}>繼續</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#000000',
    letterSpacing: 2,
    marginTop: 16,
  },
  stepContent: {
    alignItems: 'center',
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  instruction: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  mnemonicContainer: {
    width: '100%',
    marginBottom: 24,
  },
  mnemonicGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wordBox: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    padding: 8,
    alignItems: 'center',
  },
  wordNumber: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9CA3AF',
  },
  wordText: {
    fontSize: 14,
    fontFamily: 'serif',
    color: '#000000',
    marginTop: 4,
  },
  agreementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0000FF',
    borderColor: '#0000FF',
  },
  agreementText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000000',
  },
  button: {
    backgroundColor: '#000000',
    padding: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#E5E5E5',
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
  doneTitle: {
    fontSize: 20,
    fontFamily: 'monospace',
    color: '#000000',
    marginTop: 24,
  },
  doneDesc: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 280,
  },
});
