export const COLORS = {
  background: '#060C18',
  surface: '#0D1828',
  surfaceElevated: '#152030',
  surfaceHighlight: '#1C2E44',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',

  primary: '#DA70D6',
  primaryDim: 'rgba(218,112,214,0.15)',
  primaryStrong: 'rgba(218,112,214,0.3)',

  text: '#EDF1FF',
  textMuted: 'rgba(237,241,255,0.55)',
  textDim: 'rgba(237,241,255,0.3)',

  success: '#4ADE80',
  successDim: 'rgba(74,222,128,0.15)',
  error: '#F87171',
  errorDim: 'rgba(248,113,113,0.15)',
  warning: '#FBBF24',

  emdrNavy: '#000080',
  emdrOrchid: '#DA70D6',

  BG_SWATCHES: ['#222222', '#000080', '#1B4332', '#2D4A22', '#2D1B69', '#0A2463', '#1A3322', '#0A0A0A'],
  DOT_SWATCHES: ['#FFFFFF', '#FFF176', '#DA70D6', '#ADD8E6', '#FFD580', '#FFE599', '#F0FFF0', '#FFD700'],

  PRESET_THEMES: [
    { name: 'High Contrast', bg: '#222222', dot: '#FFFFFF' },
    { name: 'Classic', bg: '#000080', dot: '#DA70D6' },
    { name: 'Calming', bg: '#000080', dot: '#FFF176' },
    { name: 'Nature', bg: '#1B4332', dot: '#F0FFF0' },
    { name: 'Sage', bg: '#2D4A22', dot: '#FFD580' },
    { name: 'Meditative', bg: '#2D1B69', dot: '#FFFFFF' },
    { name: 'Grounding', bg: '#0A0A0A', dot: '#FFE599' },
    { name: 'Serene', bg: '#0A2463', dot: '#ADD8E6' },
    { name: 'Energizing', bg: '#1A3322', dot: '#FFD700' },
  ],
} as const;
