// Veritas - Hardware-Bound Social System with Data Sovereignty
// Digital Brutalism Design - No Rounded Corners, No Gradients

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, StatusBar, AppState, AppStateStatus, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

import { OnboardingScreen } from './screens/OnboardingScreen';
import { CameraScreen } from './screens/CameraScreen';
import { DevelopmentScreen } from './screens/DevelopmentScreen';
import { PrivacySelectionScreen } from './screens/PrivacySelectionScreen';
import { DailyWallScreen } from './screens/DailyWallScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { EncountersScreen } from './screens/EncountersScreen';
import { SettingsScreen } from './screens/SettingsScreen';

import { getIdentity } from './lib/identity';
import { startSensorListening, stopSensorListening } from './lib/sensors';
import { checkAndRunMidnightPurge } from './lib/dailyWall';
import { runMessageDecay } from './lib/messaging';
import { runEncounterDecay } from './lib/encounter';
import { getLockState } from './lib/travel';
import type { PolaroidBundle } from './lib/types';
import type { VisibilityLevel } from './lib/privacy';

const Tab = createBottomTabNavigator();

// Tab Navigator for main app
function MainTabs({ onOpenCamera }: { onOpenCamera: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'Wall') {
            iconName = focused ? 'images' : 'images-outline';
          } else if (route.name === 'Capture') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'mail' : 'mail-outline';
          } else if (route.name === 'Encounters') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0000FF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 2,
          borderTopColor: '#000000',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: 'monospace',
          letterSpacing: 0.5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Wall" 
        component={DailyWallScreen}
        options={{ tabBarLabel: '日記牆' }}
      />
      <Tab.Screen 
        name="Capture" 
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            onOpenCamera();
          },
        }}
        component={EmptyCameraScreen}
        options={{ tabBarLabel: '拍攝' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{ tabBarLabel: '訊息' }}
      />
      <Tab.Screen 
        name="Encounters" 
        component={EncountersScreen}
        options={{ tabBarLabel: '相遇' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreenWrapper}
        options={{ tabBarLabel: '設定' }}
      />
    </Tab.Navigator>
  );
}

// Empty screen for camera tab
function EmptyCameraScreen() {
  return null;
}

// Settings wrapper
function SettingsScreenWrapper() {
  return <SettingsScreen onLogout={() => {}} />;
}

// Camera Flow with Privacy Selection
function CameraFlow({ 
  isVisible, 
  onClose, 
  onCaptureComplete 
}: { 
  isVisible: boolean; 
  onClose: () => void;
  onCaptureComplete: () => void;
}) {
  const [capturedBundle, setCapturedBundle] = useState<PolaroidBundle | null>(null);
  const [showDevelopment, setShowDevelopment] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  useEffect(() => {
    checkLockState();
  }, []);
  
  async function checkLockState() {
    const lock = await getLockState();
    if (lock?.isLocked) {
      setIsLocked(true);
    }
  }
  
  const handleCapture = (bundle: PolaroidBundle) => {
    setCapturedBundle(bundle);
    setShowDevelopment(true);
  };
  
  const handleDevelopmentComplete = (bundle: PolaroidBundle) => {
    setShowDevelopment(false);
    setShowPrivacy(true);
  };
  
  const handlePrivacyComplete = (visibility: VisibilityLevel) => {
    if (capturedBundle) {
      capturedBundle.visibility = {
        level: visibility,
        setAt: Date.now(),
      };
    }
    setShowPrivacy(false);
    setCapturedBundle(null);
    onCaptureComplete();
    onClose();
  };
  
  if (!isVisible) return null;
  
  if (isLocked) {
    return (
      <View style={styles.lockedContainer}>
        <Ionicons name="lock-closed" size={48} color="#EF4444" />
        <Text style={styles.lockedTitle}>時空不穩定</Text>
        <Text style={styles.lockedText}>請在真實物理點稍候</Text>
        <Text style={styles.lockedHint}>系統已暫時鎖定</Text>
      </View>
    );
  }
  
  if (showPrivacy && capturedBundle) {
    return (
      <PrivacySelectionScreen
        bundle={capturedBundle}
        onComplete={handlePrivacyComplete}
      />
    );
  }
  
  if (showDevelopment && capturedBundle) {
    return (
      <DevelopmentScreen 
        bundle={capturedBundle} 
        onComplete={handleDevelopmentComplete}
      />
    );
  }
  
  return (
    <CameraScreen 
      onCapture={handleCapture}
      onClose={onClose}
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const appState = React.useRef(AppState.currentState);
  
  useEffect(() => {
    initializeApp();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      stopSensorListening();
    };
  }, []);
  
  async function initializeApp() {
    startSensorListening();
    
    const identity = await getIdentity();
    if (identity) {
      setShowOnboarding(false);
    }
    
    await checkAndRunMidnightPurge();
    await runMessageDecay();
    await runEncounterDecay();
    
    setIsInitialized(true);
  }
  
  function handleAppStateChange(nextAppState: AppStateStatus) {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      checkAndRunMidnightPurge();
      runMessageDecay();
      runEncounterDecay();
    }
    appState.current = nextAppState;
  }
  
  function handleOnboardingComplete() {
    setShowOnboarding(false);
  }
  
  function handleOpenCamera() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCamera(true);
  }
  
  function handleCloseCamera() {
    setShowCamera(false);
  }
  
  function handleCaptureComplete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  
  if (!fontsLoaded || !isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
      </View>
    );
  }
  
 if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <View style={styles.container}>
          {/* 底層的導航欄與內容 */}
          <MainTabs onOpenCamera={handleOpenCamera} />
          
          {/* 💡 絕對定位層：確保相機蓋過一切，解決「界開一半」的問題 */}
          {showCamera && (
            <View style={StyleSheet.absoluteFill}>
              <CameraFlow
                isVisible={showCamera}
                onClose={handleCloseCamera}
                onCaptureComplete={handleCaptureComplete}
              />
            </View>
          )}
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
} // 這是 App 函式的結尾

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: '#000000',
    marginTop: 24,
    letterSpacing: 2,
  },
  lockedText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#EF4444',
    marginTop: 12,
  },
  lockedHint: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginTop: 8,
  },
});