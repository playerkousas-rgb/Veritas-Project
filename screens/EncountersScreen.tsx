// Encounters Screen - "擦肩而過" Records
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getRecentEncounters, formatEncounterTime, formatEncounterLocation, type Encounter } from '../lib/encounter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function EncountersScreen() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  
  useEffect(() => {
    loadEncounters();
  }, []);
  
  async function loadEncounters() {
    const data = await getRecentEncounters();
    setEncounters(data);
  }
  
  function handleEncounterPress(encounter: Encounter) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to send first message
  }
  
  function renderEncounter({ item }: { item: Encounter }) {
    return (
      <TouchableOpacity
        style={styles.encounterCard}
        onPress={() => handleEncounterPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.encounterHeader}>
          <View style={styles.encounterAvatar}>
            <Text style={styles.encounterAvatarText}>?</Text>
          </View>
          <View style={styles.encounterInfo}>
            <Text style={styles.encounterUIN}>UIN: {item.otherUIN}</Text>
            <Text style={styles.encounterTime}>{formatEncounterTime(item.timestamp)}</Text>
          </View>
          <Text style={styles.encounterDistance}>{item.distance.toFixed(0)}m</Text>
        </View>
        
        <View style={styles.encounterLocation}>
          <Ionicons name="location" size={14} color="#0000FF" />
          <Text style={styles.encounterCoords}>{formatEncounterLocation(item)}</Text>
        </View>
        
        {item.theirPublicPhoto && (
          <View style={styles.encounterPhoto}>
            <Text style={styles.encounterPhotoHint}>有公開隨影</Text>
          </View>
        )}
        
        {!item.hasInteracted && (
          <TouchableOpacity style={styles.sayHiButton}>
            <Text style={styles.sayHiText}>打招呼</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>擦肩而過</Text>
        <Text style={styles.headerSubtitle}>三天內出現在附近的人</Text>
      </View>
      
      {/* Info */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={styles.infoText}>
          這些是你在物理空間中遇到的人。你可以向他們發出第一句搭訕。
        </Text>
      </View>
      
      {/* List */}
      {encounters.length > 0 ? (
        <FlatList
          data={encounters}
          renderItem={renderEncounter}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#E5E5E5" />
          <Text style={styles.emptyTitle}>尚無相遇紀錄</Text>
          <Text style={styles.emptyDesc}>
            走到戶外，你可能會遇到其他真實存在的人。
          </Text>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#000000',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 12,
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  encounterCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    marginBottom: 12,
  },
  encounterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  encounterAvatar: {
    width: 40,
    height: 40,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  encounterAvatarText: {
    fontSize: 20,
    color: '#6B7280',
  },
  encounterInfo: {
    flex: 1,
    marginLeft: 12,
  },
  encounterUIN: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000000',
    fontWeight: '600',
  },
  encounterTime: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9CA3AF',
    marginTop: 2,
  },
  encounterDistance: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#0000FF',
    fontWeight: '600',
  },
  encounterLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  encounterCoords: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
  encounterPhoto: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F0F0FF',
    alignItems: 'center',
  },
  encounterPhotoHint: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#0000FF',
  },
  sayHiButton: {
    marginTop: 12,
    backgroundColor: '#000000',
    padding: 12,
    alignItems: 'center',
  },
  sayHiText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#000000',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 250,
  },
});
