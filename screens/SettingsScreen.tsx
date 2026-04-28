// Settings Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getIdentity, deleteIdentity } from '../lib/identity';
import { deleteAllData, getStorageUsage } from '../lib/storage';
import { deleteKeys } from '../lib/crypto';

interface SettingsScreenProps {
  onLogout: () => void;
}

export function SettingsScreen({ onLogout }: SettingsScreenProps) {
  const [identity, setIdentity] = useState<{ uin: string; socialName: string } | null>(null);
  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  
  React.useEffect(() => {
    loadSettings();
  }, []);
  
  async function loadSettings() {
    const id = await getIdentity();
    setIdentity(id);
    
    const usage = await getStorageUsage();
    const mb = (usage.used / (1024 * 1024)).toFixed(2);
    setStorageUsed(`${mb} MB`);
  }
  
  async function handleDeleteAllData() {
    Alert.alert(
      '⚠️ DANGER',
      'This will permanently delete ALL your data including your identity, photos, and memories. This action CANNOT be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllData();
              await deleteKeys();
              await deleteIdentity();
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onLogout();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data.');
            }
          },
        },
      ]
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        
        {/* Identity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity</Text>
          
          {identity && (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Ionicons name="person" size={20} color="#3b82f6" />
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Social Name</Text>
                  <Text style={styles.cardValue}>{identity.socialName}</Text>
                </View>
              </View>
              
              <View style={styles.cardDivider} />
              
              <View style={styles.cardRow}>
                <Ionicons name="finger-print" size={20} color="#3b82f6" />
                <View style={styles.cardContent}>
                  <Text style={styles.cardLabel}>Unique ID Number</Text>
                  <Text style={styles.cardValueMono}>{identity.uin}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
        
        {/* Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>儲存空間</Text>
          
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="hardware-chip" size={20} color="#64748b" />
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>已使用</Text>
                <Text style={styles.cardValue}>{storageUsed}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>偏好</Text>
          
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="phone-portrait" size={20} color="#64748b" />
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>觸覺回饋</Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                trackColor={{ false: '#334155', true: '#3b82f6' }}
              />
            </View>
          </View>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Ionicons name="information-circle" size={20} color="#64748b" />
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Version</Text>
                <Text style={styles.cardValue}>1.0.0</Text>
              </View>
            </View>
            
            <View style={styles.cardDivider} />
            
            <View style={styles.cardRow}>
              <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>Security Model</Text>
                <Text style={styles.cardValue}>Hardware-Bound</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAllData}
          >
            <Ionicons name="trash" size={20} color="#ef4444" />
            <Text style={styles.dangerButtonText}>Delete All Data</Text>
          </TouchableOpacity>
          
          <Text style={styles.dangerWarning}>
            This will permanently delete your identity and all photos. You will not be able to recover anything.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 12,
    },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '500',
  },
  cardValueMono: {
    fontSize: 16,
    color: '#3b82f6',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#450a0a',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  dangerWarning: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
