// Messages Screen - Street Talk Protocol
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { 
  getFriendMessages, 
  getRequests, 
  sendMessage, 
  replyToMessage,
  ignoreStranger,
  canSendMessageTo,
  type VerityMessage,
  type MessageCategory,
} from '../lib/messaging';
import { getIdentity } from '../lib/identity';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function MessagesScreen() {
  const [activeTab, setActiveTab] = useState<MessageCategory>('friends');
  const [friendMessages, setFriendMessages] = useState<VerityMessage[]>([]);
  const [requests, setRequests] = useState<VerityMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<VerityMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [canSend, setCanSend] = useState(true);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [identity, setIdentity] = useState<{ uin: string } | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    const id = await getIdentity();
    setIdentity(id);
    
    const friends = await getFriendMessages();
    const reqs = await getRequests();
    
    setFriendMessages(friends);
    setRequests(reqs);
  }
  
  async function handleSelectMessage(msg: VerityMessage) {
    setSelectedMessage(msg);
    setReplyText('');
    
    // Check if can send reply
    const check = await canSendMessageTo(msg.fromUIN);
    setCanSend(check.canSend);
    setLockReason(check.reason || null);
  }
  
  async function handleSendReply() {
    if (!selectedMessage || !replyText.trim() || !canSend) return;
    
    try {
      await replyToMessage(selectedMessage, replyText.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setReplyText('');
      setSelectedMessage(null);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  }
  
  async function handleIgnore() {
    if (!selectedMessage) return;
    
    Alert.alert(
      '忽略訊息',
      '確定要忽略這則訊息嗎？對方將無法再傳訊給你。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '忽略',
          style: 'destructive',
          onPress: async () => {
            await ignoreStranger(selectedMessage.fromUIN);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setSelectedMessage(null);
            loadData();
          },
        },
      ]
    );
  }
  
  function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  }
  
  const currentMessages = activeTab === 'friends' ? friendMessages : requests;
  
  if (selectedMessage) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedMessage(null)}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.chatTitle}>UIN: {selectedMessage.fromUIN}</Text>
          {activeTab === 'requests' && (
            <TouchableOpacity onPress={handleIgnore}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Message */}
        <View style={styles.messageContainer}>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>{selectedMessage.content}</Text>
            <Text style={styles.messageTime}>{formatTime(selectedMessage.timestamp)}</Text>
          </View>
        </View>
        
        {/* Input */}
        <View style={styles.inputContainer}>
          {lockReason ? (
            <View style={styles.lockedInput}>
              <Ionicons name="lock-closed" size={20} color="#6B7280" />
              <Text style={styles.lockedText}>{lockReason}</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                value={replyText}
                onChangeText={setReplyText}
                placeholder="輸入訊息..."
                placeholderTextColor="#9CA3AF"
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !replyText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSendReply}
                disabled={!replyText.trim()}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>訊息</Text>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            好友
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            請求
          </Text>
          {requests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Message List */}
      {currentMessages.length > 0 ? (
        <FlatList
          data={currentMessages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.messageItem}
              onPress={() => handleSelectMessage(item)}
            >
              <View style={styles.messageItemAvatar}>
                <Text style={styles.messageItemAvatarText}>
                  {item.fromUIN.slice(-2)}
                </Text>
              </View>
              <View style={styles.messageItemContent}>
                <Text style={styles.messageItemUIN}>UIN: {item.fromUIN}</Text>
                <Text style={styles.messageItemPreview} numberOfLines={1}>
                  {item.content}
                </Text>
              </View>
              <Text style={styles.messageItemTime}>{formatTime(item.timestamp)}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="mail-outline" size={48} color="#E5E5E5" />
          <Text style={styles.emptyText}>
            {activeTab === 'friends' ? '尚無好友訊息' : '尚無陌生人請求'}
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0000FF',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#0000FF',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: '35%',
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  messageItemAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageItemAvatarText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#000000',
  },
  messageItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  messageItemUIN: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000000',
    fontWeight: '600',
  },
  messageItemPreview: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  messageItemTime: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#9CA3AF',
    marginTop: 16,
  },
  // Chat styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    gap: 16,
  },
  chatTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#000000',
  },
  messageContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'serif',
    color: '#000000',
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9CA3AF',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    fontSize: 14,
    fontFamily: 'serif',
    color: '#000000',
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  lockedInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
    gap: 8,
  },
  lockedText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
});
