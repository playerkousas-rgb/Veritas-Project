// Daily Wall Screen - Main Diary View
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WallPhoto } from '../components/WallPhoto';
import { HandwrittenInput } from '../components/HandwrittenInput';
import { getAllWallPhotos, selectWallPhoto, getWallStats, runDailyPurge } from '../lib/dailyWall';
import { getBundles, deleteBundle } from '../lib/storage';
import { getIdentity } from '../lib/identity';
import { verifyBundle } from '../lib/truthValidation';
import type { PolaroidBundle } from '../lib/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function DailyWallScreen() {
  const [wallPhotos, setWallPhotos] = useState<PolaroidBundle[]>([]);
  const [todaysPhotos, setTodaysPhotos] = useState<PolaroidBundle[]>([]);
  const [stats, setStats] = useState({ totalPhotos: 0, wallPhotos: 0, todayPhotos: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<PolaroidBundle | null>(null);
  const [showDiaryInput, setShowDiaryInput] = useState(false);
  const [identity, setIdentity] = useState<{ uin: string; socialName: string } | null>(null);
  
  useEffect(() => {
    loadData();
    checkMidnightPurge();
  }, []);
  
  async function loadData() {
    const photos = await getAllWallPhotos();
    setWallPhotos(photos.reverse()); // Most recent first
    
    const wallStats = await getWallStats();
    setStats(wallStats);
    
    const bundles = await getBundles();
    const today = new Date().toISOString().split('T')[0];
    const todayBundles = bundles.filter(b => {
      const photoDate = new Date(b.createdAt).toISOString().split('T')[0];
      return photoDate === today && !b.isWallPhoto;
    });
    setTodaysPhotos(todayBundles);
    
    const id = await getIdentity();
    setIdentity(id);
  }
  
  async function checkMidnightPurge() {
    await runDailyPurge();
  }
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);
  
  async function handleSelectWallPhoto(bundle: PolaroidBundle) {
    setSelectedBundle(bundle);
    setShowDiaryInput(true);
  }
  
  async function handleDiarySubmit(text: string) {
    if (!selectedBundle) return;
    
    try {
      await selectWallPhoto(selectedBundle.id, text);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowDiaryInput(false);
      setShowSelectModal(false);
      setSelectedBundle(null);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to select wall photo.');
    }
  }
  
  async function handleSkipDiary() {
    if (!selectedBundle) return;
    
    try {
      await selectWallPhoto(selectedBundle.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowDiaryInput(false);
      setShowSelectModal(false);
      setSelectedBundle(null);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to select wall photo.');
    }
  }
  
  function renderWallPhoto({ item }: { item: PolaroidBundle }) {
    return <WallPhoto bundle={item} />;
  }
  
  function renderTodayPhoto({ item }: { item: PolaroidBundle }) {
    return (
      <TouchableOpacity
        style={styles.todayPhotoItem}
        onPress={() => handleSelectWallPhoto(item)}
      >
        <View style={styles.todayPhotoPreview}>
          <View style={styles.todayPhotoPlaceholder}>
            <Ionicons name="image" size={24} color="#64748b" />
          </View>
        </View>
        <Text style={styles.todayPhotoTime}>
          {new Date(item.createdAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </TouchableOpacity>
    );
  }
  
  const today = new Date().toISOString().split('T')[0];
  const hasWallPhotoToday = wallPhotos.some(p => p.wallDate === today);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>日記牆</Text>
          <Text style={styles.headerSubtitle}>回憶</Text>
        </View>
        
        {identity && (
          <View style={styles.identityBadge}>
            <Text style={styles.identityName}>{identity.socialName}</Text>
            <Text style={styles.identityUin}>UIN: {identity.uin}</Text>
          </View>
        )}
      </View>
      
      {/* Today's selection */}
      {todaysPhotos.length > 0 && !hasWallPhotoToday && (
        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <Ionicons name="sunny" size={20} color="#f59e0b" />
            <Text style={styles.todayTitle}>今日照片</Text>
          </View>
          <Text style={styles.todayHint}>選擇一張掛牆</Text>
          
          <FlatList
            data={todaysPhotos}
            renderItem={renderTodayPhoto}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.todayList}
          />
        </View>
      )}
      
      {/* Wall photos */}
      {wallPhotos.length > 0 ? (
        <FlatList
          data={wallPhotos}
          renderItem={renderWallPhoto}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.wallList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#64748b"
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color="#334155" />
          <Text style={styles.emptyTitle}>尚無回憶</Text>
          <Text style={styles.emptyDesc}>
            拍攝一張照片開始建立你的牆。每天只保留一個物理瞬間。
          </Text>
        </View>
      )}
      
      {/* Selection Modal */}
      <Modal
        visible={showDiaryInput}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <HandwrittenInput
            onSubmit={handleDiarySubmit}
            onCancel={handleSkipDiary}
            placeholder="Write a memory..."
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  identityBadge: {
    alignItems: 'flex-end',
  },
  identityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  identityUin: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  todaySection: {
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    marginBottom: 8,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  todayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    flex: 1,
  },
  todayCount: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  todayHint: {
    fontSize: 12,
    color: '#64748b',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  todayList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  todayPhotoItem: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  todayPhotoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  todayPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPhotoTime: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  wallList: {
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1f5f9',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
