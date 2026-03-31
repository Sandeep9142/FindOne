/* ─────────────────────────────────────────────
   Application Constants
   ───────────────────────────────────────────── */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'FindOne';
export const IS_DEV = import.meta.env.DEV;

// Auth
export const TOKEN_KEY = 'findone_token';
export const REFRESH_TOKEN_KEY = 'findone_refresh_token';
export const USER_KEY = 'findone_user';

// Roles
export const ROLES = {
  WORKER: 'worker',
  CLIENT: 'client',
  ADMIN: 'admin',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 12;

// File uploads
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Breakpoints (match Tailwind)
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};
