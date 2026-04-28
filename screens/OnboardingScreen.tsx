// Onboarding Screen - Identity Creation with Soul Rituals
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { initializeIdentity, getIdentity, updateSocialName, checkEmulator } from '../lib/identity';
import { initializeStorage } from '../lib/storage';
import { generateMnemonic, storeMnemonicHash } from '../lib/legacy';
import type { DeviceIdentity } from '../lib/types';
import { Vibration } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<'awakening' | 'init' | 'name' | 'legacy' | 'done'>('awakening');
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null);
  const [socialName, setSocialName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLongPressed, setHasLongPressed] = useState(false);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [isPressing, setIsPressing] = useState(false); // 控制文字是否該出現
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // 💡 [1/5] 新增：控制閃爍文字透明度的 Animated Value
  const sensingOpacity = useRef(new Animated.Value(0)).current;
  // 💡 [2/5] 新增：用來保存閃爍動畫實例的 ref，以便隨時停止它
  const blinkAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    checkExistingIdentity();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [step]);

  // 💡 [3/5] 新增：定義閃爍動畫邏輯
  const startBlinking = () => {
    // 停止之前的動畫防止疊加
    if (blinkAnimationRef.current) blinkAnimationRef.current.stop();
    
    sensingOpacity.setValue(1);
    blinkAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(sensingOpacity, {
          toValue: 0.1,
          duration: 500,
          useNativeDriver: true,
          isInteraction: false, // 💡 關鍵：確保手勢按住時動畫不被暫停
        }),
        Animated.timing(sensingOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );
    blinkAnimationRef.current.start();
  };

  const stopBlinking = () => {
    // 1. 停止動畫循環
    if (blinkAnimationRef.current) {
      blinkAnimationRef.current.stop();
    }
    // 2. 💡 強制歸零！這是解決「半透明殘留」的關鍵
    sensingOpacity.setValue(0); 
  };

  async function checkExistingIdentity() {
    const existing = await getIdentity();
    if (existing) {
      setIdentity(existing);
      setSocialName(existing.socialName);
      setStep('done');
    }
  }

  // 💡 [4/5] 修改：新增 onPressIn 處理函數
  function handlePressIn() {
    // 1. 開始輕微的觸覺反饋，告知用戶「按到了」
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // 2. 開始文字閃爍動畫
    startBlinking();
  }

  function handleLongPress() {
    setHasLongPressed(true);
    
    // 1. 這裡一定要呼叫 stopBlinking，確保動畫實例停止且數值歸零
    stopBlinking(); 
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        // 2. 為了保險，切換 step 之前再次強制歸零
        sensingOpacity.setValue(0); 
        setStep('init');
      }
    });
  }

  function handlePressOut() {
    // 無論是否成功長按，放手時都要停止閃爍
    stopBlinking();

    if (!hasLongPressed) {
      // 如果未滿 3 秒就放手，重置進度條
      progressAnim.setValue(0);
    }
    setHasLongPressed(false);
  }

  // ... handleInitialize, handleSetName, handleComplete 等邏輯保持不變 ...
  async function handleInitialize() {
    setLoading(true);
    setError(null);
    
    try {
      const isEmulator = await checkEmulator();
      if (isEmulator) {
        setError('警告：運行於模擬器。部分功能受限。');
      }
      
      await initializeStorage();
      
      const newIdentity = await initializeIdentity();
      setIdentity(newIdentity);
      setSocialName(newIdentity.socialName);
      setStep('name');
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError('無法初始化身份。請重試。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleSetName() {
    if (!socialName.trim()) return;
    setLoading(true);
    try {
      // 1. 更新資料庫/後端
      await updateSocialName(socialName.trim());
      
      // 2. 💡 關鍵：同步更新本地的 identity 狀態
      // 這樣最後一頁顯示 {identity.socialName} 時，才會是 "SHEEP"
      if (identity) {
        setIdentity({
          ...identity,
          socialName: socialName.trim()
        });
      }

      const words = generateMnemonic();
      setMnemonic(words);
      await storeMnemonicHash(words);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('legacy');
    } catch (err) {
      setError('無法儲存名稱。');
    } finally {
      setLoading(false);
    }
  }
  
  function handleComplete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
       <View style={styles.logoContainer}>
  <View style={{ height: 20, marginBottom: 10 }}>
    {/* 只有在第一步才渲染這行字 */}
    {step === 'awakening' && (
      <Animated.Text style={[styles.sensingText, { opacity: sensingOpacity }]}>
        SENSING...
      </Animated.Text>
    )}
  </View>
          <View style={styles.logo}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}></Text>
          <Text style={styles.tagline}>Capture Truth. Share Reality.</Text>
        </View>
        
        {step === 'awakening' && (
  <View style={styles.stepContainer}>
    <Text style={styles.manifesto}>
      回憶不一定美好，但必然珍貴。{'\n'}
      Memories are precious. {'\n'}
      相遇不一定有緣，但必定真實。{'\n'}
      Encounters are real.
    </Text>
    
    {/* 💡 確保這裡有一個固定的容器高度，避免文字出現時推擠 Logo */}
 
              
    <TouchableOpacity
      style={styles.awakeningButton}
      activeOpacity={1}               // 💡 設為 1 避免自帶的變暗效果干擾你的動畫
      onPressIn={handlePressIn}        
      onLongPress={handleLongPress}     
      onPressOut={handlePressOut}       
      delayLongPress={3000}             // 💡 縮短一點點時間，讓反應更快
    >
      <Animated.View 
        style={[
          styles.progressRing, 
          { 
            // 💡 這裡將 progressAnim 對應到寬度，讓它有視覺上的增長感
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 140] 
            }),
            opacity: 0.3
          }
        ]} 
      />
      <Image 
        source={require('../assets/aperture.png')} 
        style={{ width: 140, height: 140, zIndex: 10 }}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>
)}
        
        {/* ... init, name, legacy, done 步驟保持不變 ... */}
        {step === 'init' && (
        <View style={[styles.stepContainer, { alignItems: 'center' }]}>
          <Text style={[styles.stepTitle, { marginTop: 10 }]}>
            創建身份{"\n"}
            IDENTITY GENESIS
          </Text>

          <Text style={styles.stepDesc}>
            你是唯一且不可複製。{"\n"}
            YOU ARE UNIQUE AND IRREPLACEABLE.
          </Text>

          <TouchableOpacity
            style={[styles.circularButton, loading && styles.buttonDisabled]}
            onPress={handleInitialize}
            disabled={loading}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="finger-print"
                size={52}
                color={loading ? "#9CA3AF" : "#000000"}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}
        
        {step === 'name' && identity && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}></Text>
            <View style={styles.uinDisplay}>
              <Text style={styles.uinLabel}>唯一識別碼Unique Identifier</Text>
              <Text style={styles.uinValue}>{identity.uin}</Text>
            </View>
            
            <Text style={styles.inputLabel}>匿稱 Nick Name</Text>
            <TextInput
              style={styles.input}
              value={socialName}
              onChangeText={setSocialName}
              placeholder="輸入名稱"
              placeholderTextColor="#9CA3AF"
              maxLength={30}
            />
            
            <TouchableOpacity
              style={[styles.button, (!socialName.trim() || loading) && styles.buttonDisabled]}
              onPress={handleSetName}
              disabled={!socialName.trim() || loading}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>確認</Text>
            </TouchableOpacity>
          </View>
        )}
        
       {step === 'legacy' && (
  <View style={[styles.stepContainer, { alignItems: 'center' }]}>
    <Ionicons name="key-outline" size={42} color="#0000FF" style={{ marginBottom: 30 }} />

    <Text style={styles.stepTitle}>
      PHYSICAL LEGACY{"\n"}
      物理繼承
    </Text>

    <Text style={styles.stepDesc}>
      These 4 words are your ONLY recovery method.{"\n"}
      Please secure them in a physical place.
    </Text>

    <View style={styles.mnemonicPreview}>
      {mnemonic.slice(0, 4).map((word, i) => (
        <View key={i} style={styles.mnemonicBadge}>
          <Text style={styles.mnemonicWord}>{word.toLowerCase()}</Text>
        </View>
      ))}
    </View>

    <TouchableOpacity 
      style={styles.button} 
      onPress={() => setStep('done')}
    >
      <Text style={styles.buttonText}>I HAVE SECURED THEM</Text>
    </TouchableOpacity>
  </View>
)}
        
        {step === 'done' && identity && (
          <View style={styles.stepContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#0000FF" />
            </View>
            <Text style={styles.stepTitle}>Welcome，{identity.socialName}</Text>
            <Text style={styles.uinSmall}>UIN: {identity.uin}</Text>
            
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#0000FF" />
              <Text style={styles.infoText}>
                不關心你的生活，只在意你的存在。Blind to your path, but witness to your soul.
              </Text>
            </View>
            
            <TouchableOpacity style={styles.button} onPress={handleComplete}>
              <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Veritas</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... 其他原有樣式不變 ...
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
 logo: {
  width: 150,
  height: 150,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
  overflow: 'hidden',
},

logoImage: {
  width: 150,
  height: 150,
},
  appName: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#000000',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#9CA3AF',
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  stepContainer: {
    alignItems: 'center',
  },
  manifesto: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
    marginBottom: 40,
  },
  
  // 💡 [新增] 閃爍文字的樣式
  sensingText: {
    fontFamily: 'monospace',
    fontSize: 12,        // 💡 稍微縮小一點，更像系統偵測文字
    color: '#0000FF', 
    letterSpacing: 5,    // 💡 增加間距增加儀式感
    textAlign: 'center',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,    // 💡 稍微調整間距
    marginTop: 20,       // 💡 頂部留一點白，讓 SENSING 不會貼齊邊緣
  },

  awakeningButton: {
    width: 140,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', 
    position: 'relative',
  },

  fullButtonImage: {
    width: 140,
    height: 70,
    zIndex: 10,
    resizeMode: 'contain',
  },
  
  progressRing: {
    position: 'absolute',
    width: 138,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 0, 0, 0.05)', 
  },
  // ... 其他原有樣式不變 ...
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  stepDesc: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  uinDisplay: {
    borderWidth: 1,
    borderColor: '#000000',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#FAFAFA',
  },
  uinLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6B7280',
    letterSpacing: 1,
  },
  uinValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#0000FF',
    letterSpacing: 4,
    marginTop: 8,
  },
  uinSmall: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#000000',
    padding: 16,
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 24,
    borderRadius: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
    borderRadius: 30,
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
  successIcon: {
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    marginBottom: 24,
    maxWidth: 300,
    gap: 12,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000000',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  mnemonicPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  mnemonicWord: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0000FF',
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    overflow: 'hidden',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginTop: 16,
    maxWidth: 300,
    gap: 8,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#92400E',
  },
});