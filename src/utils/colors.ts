// Living Journal palette — warm earth tones, cream paper backgrounds, real-photo-friendly.
// Inherits the V2 design exploration approved on 2026-05-10.
export const colors = {
  // Base canvas
  background: '#f4ebd8',      // Cream paper
  backgroundDim: '#ebe0d0',   // Slightly darker for headers/wells
  surface: '#ffffff',         // Cards
  surfaceWarm: '#faf3e0',     // Sheet bg, heatmap card bg

  // Brand
  primary: '#c4805a',         // Terracotta — primary actions, today-indicator
  primaryDeep: '#a66c4c',     // Pressed/active states
  accent: '#c4a060',          // Olive-tan — secondary accents, heatmap chips
  primaryLight: '#e8ddd4',    // Gradient stop in pet header

  // Type
  text: '#3d2817',            // Deep walnut (was #2d2420 — slightly warmer)
  textSecondary: '#5a4030',
  textMuted: '#8c6e50',       // Italic helper text
  textHint: '#a8957c',        // Weekday labels, very small print

  // Borders
  border: '#ebd9b8',          // Card borders, very subtle
  borderStrong: '#d4c5a0',    // Sheet boundaries, dividers

  // Day-icon heatmap palette (cell backgrounds + borders)
  dayPhoto:     { bg: '#fff0d8', border: '#f0d8a0' },  // 📷 memory
  dayTraining:  { bg: '#f0e0d0', border: '#c4a060' },  // 🎯
  dayActivity:  { bg: '#e8f5e0', border: '#c8e0b0' },  // 🐾 outing
  dayMed:       { bg: '#e0e8f0', border: '#a8c0d8' },  // 💊
  dayReaction:  { bg: '#f5d8c8', border: '#e0a890' },  // ⚠️ tough day
  dayMilestone: { bg: '#fff5a0', border: '#e0c440' },  // ⭐

  // Semantic
  success: '#5a8f5a',
  fi: '#5a8f5a',
  fiBg: '#e8f5e8',
  reminder: '#e8a840',
  reminderBg: '#fffbf0',
  medication: '#4a6fa5',
  medicationBg: '#e8f0ff',
  vaccine: '#5a8f5a',
  vaccineBg: '#e8f5e8',
  vetIcon: '#f0e8f5',
  error: '#c44',

  // Empty-day dot
  emptyDot: '#e3d4b0',
};

// Type families. Match the design exploration.
// On native we load via @expo-google-fonts/*; on web Storybook these
// resolve via the Google Fonts CDN.
export const fonts = {
  serif:    'Fraunces_500Medium',
  serifBold:'Fraunces_600SemiBold',
  cursive:  'Caveat_400Regular',
  sans:     'Inter_500Medium',
  sansBold: 'Inter_700Bold',
};
