// Scopes pedidos no login com Google (ver plano: só o mínimo para cada funcionalidade).
export const ESCOPOS_GOOGLE = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.compose',
] as const;
