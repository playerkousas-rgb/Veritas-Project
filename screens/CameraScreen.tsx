import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Platform 
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CameraScreenProps {
  onCapture: (bundle: any) => void;
  onClose: () => void;
}

export function CameraScreen({ onCapture, onClose }: CameraScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [isFlash, setIsFlash] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>[ SYSTEM.CAMERA_ERROR ]</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
          <Text style={styles.retryText}>RETRY_ACCESS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 24 }} onPress={onClose}>
          <Text style={styles.escText}>[ ESCAPE ]</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleTakePicture() {
    if (!cameraRef.current) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: true,
      });

      if (photo) {
        onCapture({
          id: `img_${Date.now()}`,
          imageUri: photo.uri,
          createdAt: Date.now(),
          width: photo.width,
          height: photo.height,
          isVerified: true, 
        });
      }
    } catch (error) {
      console.error("Capture Error:", error);
    }
  }

  return (
    <View style={styles.container}>
      {/* 💡 核心修正：使用 absoluteFill 讓相機無視 Tab Bar 擠壓，鋪滿全螢幕 */}
      <CameraView 
        style={StyleSheet.absoluteFill} 
        ref={cameraRef}
        facing={facing}
        enableTorch={isFlash === 'on'}
      />

      {/* 💡 疊加層：所有的 UI 元素浮在鏡頭背景上 */}
      <View style={styles.overlay}>
        
        {/* 頂部控制欄：增加半透黑底確保在亮處也能看見 */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.escBtn}>
            <Text style={styles.escText}>[ ESC ]</Text>
          </TouchableOpacity>
          
          <View style={styles.topRight}>
            <TouchableOpacity onPress={() => setIsFlash(f => f === 'on' ? 'off' : 'on')} style={styles.iconBtn}>
              <Ionicons name={isFlash === 'on' ? "flash" : "flash-off"} size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} style={styles.iconBtn}>
              <Ionicons name="camera-reverse" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 底部快門區：使用 paddingBottom 避開 Tab Bar 位置，維持浮動感 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleTakePicture}
            style={styles.shutterOuter}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          
          {/* 底部邊框飾條：強化數位野獸派風格 */}
          <View style={styles.viewfinderLine} />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  topRight: {
    flexDirection: 'row',
    gap: 15,
  },
  iconBtn: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  escBtn: {
    padding: 10,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  escText: {
    color: '#FFF',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '900',
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 110, // 💡 關鍵：向上推開，避開下方的 Tab Bar 區域
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    borderWidth: 6,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    // 增加硬質陰影 (野獸派風格)
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: 'transparent',
  },
  viewfinderLine: {
    marginTop: 20,
    width: 40,
    height: 4,
    backgroundColor: '#FFF',
  },
  errorText: {
    color: '#FF0000',
    fontFamily: 'monospace',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    padding: 12,
  },
  retryText: {
    color: '#FFF',
    fontFamily: 'monospace',
  }
});