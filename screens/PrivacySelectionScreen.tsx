import React, { useState } from 'react';
/* 💡 這裡只補上 Image, 確保原本的組件都在 */
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { VisibilityLevel } from '../lib/privacy';
import { getVisibilityLabel, getVisibilityIcon, getVisibilityColor } from '../lib/privacy';
import type { PolaroidBundle } from '../lib/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PrivacySelectionScreenProps {
  bundle: PolaroidBundle;
  onComplete: (visibility: VisibilityLevel) => void;
}

export function PrivacySelectionScreen({ bundle, onComplete }: PrivacySelectionScreenProps) {
  const [selected, setSelected] = useState<VisibilityLevel | null>(null);
  const options: VisibilityLevel[] = ['public', 'friends', 'private'];
  
  async function handleSelect(level: VisibilityLevel) {
    setSelected(level);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  
  async function handleConfirm() {
    if (!selected) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete(selected);
  }
  
  return (
    <View style={{ flex: 1 }}>
      {/* 1. 把你的 Canva 圖鋪在最下面 */}
      <Image 
        source={require('../assets/handbook_layout_final.png')} 
        style={{
        position: 'absolute',
        width: SCREEN_WIDTH,  // 這裡就是 393
        height: SCREEN_HEIGHT, // 這裡就是 852
        top: 0,
        left: 0,
      }}
      resizeMode="stretch" 
    />

      {/* 2. 原本專業的 SafeAreaView 和所有邏輯 */}
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        
        {/* 把 Header 隱藏，但保留位置 */}
        <View style={[styles.header, { opacity: 0, borderBottomWidth: 0 }]}>
          <Text style={styles.title}>設定可見性</Text>
          <Text style={styles.subtitle}>決定這張照片的社交距離</Text>
        </View>
        
        <View style={styles.optionsContainer}>
          {options.map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.optionCard,
                { backgroundColor: 'transparent', borderColor: 'transparent', borderWidth: 0 },
                selected === level && { backgroundColor: 'rgba(0,0,0,0.03)' } // 選中時淡淡的提示
              ]}
              onPress={() => handleSelect(level)}
              activeOpacity={0.8}
            >
              {/* 內容全部隱藏，讓底圖顯示 */}
              <View style={{ opacity: 0 }}>
                <View style={styles.optionHeader}>
                  <Ionicons name={getVisibilityIcon(level) as any} size={28} />
                  <Text style={styles.optionTitle}>{level.toUpperCase()}</Text>
                </View>
                <Text style={styles.optionLabel}>{getVisibilityLabel(level)}</Text>
                <Text style={styles.optionDesc}>描述...</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* 警告區域也隱藏 */}
        <View style={[styles.warningBox, { opacity: 0 }]} />
        
        <View style={[styles.footer, { borderTopWidth: 0 }]}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: 'transparent' }, // 隱藏按鈕顏色，對準貼紙
              !selected && { opacity: 0 },
            ]}
            onPress={handleConfirm}
            disabled={!selected}
          >
            <Text style={{ opacity: 0 }}>確認設定</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#000000',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginTop: 4,
  },
  optionsContainer: {
    padding: 20,
    gap: 12,
  },
  optionCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: '#E5E5E5',
    padding: 20,
    height: 190,
    position: 'relative',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderColor: '#0000FF',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#000000',
    letterSpacing: 1,
  },
  optionTitleSelected: {
    color: '#0000FF',
  },
  optionLabel: {
    fontSize: 14,
    fontFamily: 'serif',
    color: '#0000FF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 18,
  },
  checkMark: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
  footer: {
  padding: 10,
  borderTopWidth: 0,      // 把礙眼的黑橫線消掉
  bottom: 30,         // 💡 調整這個：把按鈕整體往下推
  alignItems: 'flex-end',  // 💡 如果要靠右就改 'flex-end'
  paddingRight: 30, // 往左微調一點點，對準貼紙中心
},
confirmButton: {
  backgroundColor: 'red',
  padding: 16,           // 💡 調整這個：改變按鈕的大小感
  width: 140,            // 💡 或者直接指定寬度
  height: 70,
  borderRadius: 10,
},
  confirmButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  confirmButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
