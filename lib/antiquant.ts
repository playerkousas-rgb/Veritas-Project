// Anti-Quantification - No Numbers Except Physical Constants
// This module ensures no cumulative statistics are displayed

// Allowed numbers in the system:
// - UIN (8-digit identification)
// - GPS Coordinates (latitude, longitude)
// - Timestamps (Unix time)
// - 15-second countdown
// - Distance in meters (for encounters)

// Prohibited:
// - Total photo count
// - Total friends count
// - Total encounters count
// - View counts
// - Like counts
// - Any cumulative metrics

export function validateNoQuantification(displayText: string): boolean {
  // Check for prohibited patterns
  const prohibitedPatterns = [
    /總共\s*\d+/,
    /共\s*\d+\s*張/,
    /共\s*\d+\s*位/,
    /\d+\s*張照片/,
    /\d+\s*個朋友/,
    /\d+\s*次/, // counts
    /total.*\d+/i,
    /\d+.*photos/i,
    /\d+.*friends/i,
    /\d+.*views/i,
    /\d+.*likes/i,
  ];
  
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(displayText)) {
      console.warn('Quantification detected and blocked:', displayText);
      return false;
    }
  }
  
  return true;
}

// Format functions that avoid quantification

export function formatMemoryCount(_count: number): string {
  // Don't show the number, just show that memories exist
  return '回憶';
}

export function formatEncounterCount(_count: number): string {
  // Don't show the number
  return '擦肩而過';
}

export function formatFriendCount(_count: number): string {
  // Don't show the number
  return '朋友';
}

// "在 Veritas 裡，每一次存在都是獨立的，不應被量化。"
