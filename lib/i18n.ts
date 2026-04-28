// i18n Configuration - Multi-language Foundation
// Using simple object-based i18n (i18next would need additional setup)

type Language = 'zh' | 'en';

const translations = {
  zh: {
    // App
    appName: 'VERITAS',
    tagline: '回憶不一定美好，但必然珍貴',
    
    // Onboarding
    awakening: '覺醒',
    awakeningInstruction: '長按下方按鈕 3 秒以覺醒',
    manifesto: '回憶不一定美好，但必然珍貴\n相遇不一定有緣，但必定真實',
    createIdentity: '創建身份',
    identityBound: '你的身份將綁定此裝置。無法備份或匯出。',
    generateIdentity: '生成身份',
    generating: '生成中...',
    yourPhysicalId: '你的物理 ID',
    uniqueIdNumber: '唯一識別碼',
    chooseSocialName: '選擇你的社交名稱',
    enterName: '輸入名稱',
    confirm: '確認',
    physicalLegacy: '物理繼承',
    legacyDesc: '這 24 個詞是你唯一的恢復手段。\n請用紙筆抄寫，妥善保管。',
    moreWords: '...還有 20 個詞',
    writtenDown: '我已抄寫',
    welcome: '歡迎',
    philosophy: '我們不關心你的生活，我們只在意你的存在。',
    enterVeritas: '進入 Veritas',
    
    // Privacy
    setVisibility: '設定可見性',
    visibilityDesc: '決定這張照片的社交距離',
    public: '公開',
    publicLabel: '街頭投影',
    publicDesc: '任何 50 米內的陌生人都能看見這張照片，就像你走在街上一樣。',
    friends: '朋友',
    friendsLabel: '空間共鳴',
    friendsDesc: '只有你已握手的好友能在動態流中看見這張照片。',
    private: '私密',
    privateLabel: '個人回憶',
    privateDesc: '這張照片只存在你的手機裡，對外界完全隱形。',
    confirmSetting: '確認設定',
    autoBackupNote: '照片已自動備份至系統相簿，但禁止從相簿上傳回 App。',
    
    // Camera
    physicalMode: '物理模式',
    gpsReady: 'GPS 就緒',
    tapToCapture: '點擊拍攝',
    
    // Development
    developing: '顯影中...',
    remaining: '後剩餘',
    darkroomHint: '照片正在暗房中顯影',
    
    // Messages
    messages: '訊息',
    friendsTab: '好友',
    requestsTab: '請求',
    noFriendMessages: '尚無好友訊息',
    noRequests: '尚無陌生人請求',
    waitingReply: '等待對方回覆中...',
    ignored: '對方已忽略你的訊息',
    enterMessage: '輸入訊息...',
    ignoreMessage: '忽略訊息',
    ignoreConfirm: '確定要忽略這則訊息嗎？對方將無法再傳訊給你。',
    cancel: '取消',
    ignore: '忽略',
    
    // Encounters
    encounters: '擦肩而過',
    encountersDesc: '三天內出現在附近的人',
    encountersInfo: '這些是你在物理空間中遇到的人。你可以向他們發出第一句搭訕。',
    noEncounters: '尚無相遇紀錄',
    noEncountersDesc: '走到戶外，你可能會遇到其他真實存在的人。',
    sayHi: '打招呼',
    hasPublicPhoto: '有公開隨影',
    
    // Resonance
    witnessedHere: '曾於此地見證真實',
    timeAgo: '前',
    
    // Wall
    myWall: '日記牆',
    memories: '個回憶',
    todaysPhotos: '今日照片',
    selectToWall: '選擇一張掛牆',
    noMemories: '尚無回憶',
    noMemoriesDesc: '拍攝一張照片開始建立你的牆。每天只保留一個物理瞬間。',
    
    // Settings
    settings: '設定',
    identity: '身份',
    socialName: '社交名稱',
    uniqueId: '唯一識別碼',
    storage: '儲存空間',
    storageUsed: '已使用',
    preferences: '偏好',
    hapticFeedback: '觸覺回饋',
    about: '關於',
    version: '版本',
    securityModel: '安全模型',
    hardwareBound: '硬體綁定',
    dangerZone: '危險區域',
    deleteAllData: '刪除所有資料',
    deleteWarning: '這將永久刪除你的身份和所有照片。你將無法恢復任何內容。',
    
    // Watermark labels
    location: '位置',
    time: '時間',
    provenance: '來源',
    
    // Lock
    spacetimeUnstable: '時空不穩定',
    waitAtLocation: '請在真實物理點稍候',
    systemLocked: '系統已暫時鎖定',
    
    // Voyager Sync
    voyagerSync: '遠行者同步',
    syncingWith: '正在同步',
    longPressToSync: '長按以同步',
    syncComplete: '同步完成',
    syncFailed: '同步失敗',
  },
  en: {
    // App
    appName: 'VERITAS',
    tagline: 'Memories may not be beautiful, but they are precious',
    
    // Onboarding
    awakening: 'AWAKEN',
    awakeningInstruction: 'Long press the button below for 3 seconds to awaken',
    manifesto: 'Memories may not be beautiful, but they are precious\nEncounters may not be destined, but they are real',
    createIdentity: 'Create Identity',
    identityBound: 'Your identity will be bound to this device. Cannot be backed up or exported.',
    generateIdentity: 'Generate Identity',
    generating: 'Generating...',
    yourPhysicalId: 'Your Physical ID',
    uniqueIdNumber: 'Unique Identification Number',
    chooseSocialName: 'Choose Your Social Name',
    enterName: 'Enter name',
    confirm: 'Confirm',
    physicalLegacy: 'Physical Legacy',
    legacyDesc: 'These 24 words are your only recovery method.\nWrite them down on paper and keep them safe.',
    moreWords: '...and 20 more words',
    writtenDown: 'I have written them down',
    welcome: 'Welcome',
    philosophy: 'We do not care about your life, we only care about your existence.',
    enterVeritas: 'Enter Veritas',
    
    // Privacy
    setVisibility: 'Set Visibility',
    visibilityDesc: 'Decide the social distance of this photo',
    public: 'PUBLIC',
    publicLabel: 'Street Projection',
    publicDesc: 'Anyone within 50 meters can see this photo, just like walking on the street.',
    friends: 'FRIENDS',
    friendsLabel: 'Spatial Resonance',
    friendsDesc: 'Only your trusted peers can see this photo in their feed.',
    private: 'PRIVATE',
    privateLabel: 'Personal Memory',
    privateDesc: 'This photo exists only on your phone, invisible to the outside world.',
    confirmSetting: 'Confirm Setting',
    autoBackupNote: 'Photo auto-backed up to system album, but upload from album is prohibited.',
    
    // Camera
    physicalMode: 'Physical Mode',
    gpsReady: 'GPS Ready',
    tapToCapture: 'Tap to capture',
    
    // Development
    developing: 'Developing...',
    remaining: ' remaining',
    darkroomHint: 'Photo is developing in the darkroom',
    
    // Messages
    messages: 'Messages',
    friendsTab: 'Friends',
    requestsTab: 'Requests',
    noFriendMessages: 'No friend messages yet',
    noRequests: 'No stranger requests yet',
    waitingReply: 'Waiting for reply...',
    ignored: 'They have ignored your message',
    enterMessage: 'Enter message...',
    ignoreMessage: 'Ignore Message',
    ignoreConfirm: 'Are you sure you want to ignore this message? They will not be able to message you again.',
    cancel: 'Cancel',
    ignore: 'Ignore',
    
    // Encounters
    encounters: 'Encounters',
    encountersDesc: 'People nearby in the last 3 days',
    encountersInfo: 'These are people you encountered in physical space. You can send them a first message.',
    noEncounters: 'No encounters yet',
    noEncountersDesc: 'Go outside, you might meet other real people.',
    sayHi: 'Say Hi',
    hasPublicPhoto: 'Has public photo',
    
    // Resonance
    witnessedHere: 'witnessed truth here',
    timeAgo: ' ago',
    
    // Wall
    myWall: 'My Wall',
    memories: ' memories',
    todaysPhotos: 'Today\'s Photos',
    selectToWall: 'Select one for wall',
    noMemories: 'No memories yet',
    noMemoriesDesc: 'Take a photo to start building your wall. Only one physical moment per day.',
    
    // Settings
    settings: 'Settings',
    identity: 'Identity',
    socialName: 'Social Name',
    uniqueId: 'Unique ID',
    storage: 'Storage',
    storageUsed: 'Used',
    preferences: 'Preferences',
    hapticFeedback: 'Haptic Feedback',
    about: 'About',
    version: 'Version',
    securityModel: 'Security Model',
    hardwareBound: 'Hardware-Bound',
    dangerZone: 'Danger Zone',
    deleteAllData: 'Delete All Data',
    deleteWarning: 'This will permanently delete your identity and all photos. You will not be able to recover anything.',
    
    // Watermark labels
    location: 'LOCATION',
    time: 'TIME',
    provenance: 'PROVENANCE',
    
    // Lock
    spacetimeUnstable: 'Spacetime Unstable',
    waitAtLocation: 'Please wait at a real physical location',
    systemLocked: 'System temporarily locked',
    
    // Voyager Sync
    voyagerSync: 'Voyager Sync',
    syncingWith: 'Syncing with',
    longPressToSync: 'Long press to sync',
    syncComplete: 'Sync Complete',
    syncFailed: 'Sync Failed',
  },
};

let currentLanguage: Language = 'zh';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: string): string {
  const keys = key.split('.');
  let value: any = translations[currentLanguage];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Direct access to translations object
export { translations };
