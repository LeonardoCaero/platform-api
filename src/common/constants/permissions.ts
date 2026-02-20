/**
 * Centralized Permission Catalog
 * 
 * Format: RESOURCE:ACTION
 * 
 * Scopes:
 * - GLOBAL: Platform-level permissions, assigned directly to users
 * - COMPANY: Company-level permissions, assigned via roles
 */

export const PERMISSIONS = {
  // ==========================================
  // PLATFORM PERMISSIONS (Global Scope)
  // ==========================================
  PLATFORM: {
    MANAGE_USERS: 'PLATFORM:MANAGE_USERS',
    MANAGE_PERMISSIONS: 'PLATFORM:MANAGE_PERMISSIONS',
    VIEW_ANALYTICS: 'PLATFORM:VIEW_ANALYTICS',
    MANAGE_SETTINGS: 'PLATFORM:MANAGE_SETTINGS',
  },

  // ==========================================
  // COMPANY PERMISSIONS (Company Scope)
  // ==========================================
  COMPANY: {
    CREATE: 'COMPANY:CREATE',              // Global permission to create companies
    EDIT_SETTINGS: 'COMPANY:EDIT_SETTINGS',
    DELETE: 'COMPANY:DELETE',
    VIEW_DETAILS: 'COMPANY:VIEW_DETAILS',
    VIEW_ANALYTICS: 'COMPANY:VIEW_ANALYTICS',
    EXPORT_DATA: 'COMPANY:EXPORT_DATA',
  },

  // Member Management
  MEMBER: {
    INVITE: 'MEMBER:INVITE',
    REMOVE: 'MEMBER:REMOVE',
    EDIT_ROLE: 'MEMBER:EDIT_ROLE',
    VIEW_LIST: 'MEMBER:VIEW_LIST',
    VIEW_DETAILS: 'MEMBER:VIEW_DETAILS',
  },

  // Role Management
  ROLE: {
    CREATE: 'ROLE:CREATE',
    EDIT: 'ROLE:EDIT',
    DELETE: 'ROLE:DELETE',
    VIEW: 'ROLE:VIEW',
    ASSIGN_PERMISSIONS: 'ROLE:ASSIGN_PERMISSIONS',
  },

  // Invoice Management (example future module)
  INVOICE: {
    CREATE: 'INVOICE:CREATE',
    EDIT: 'INVOICE:EDIT',
    DELETE: 'INVOICE:DELETE',
    VIEW: 'INVOICE:VIEW',
    APPROVE: 'INVOICE:APPROVE',
    EXPORT: 'INVOICE:EXPORT',
  },

  // Report Management
  REPORT: {
    CREATE: 'REPORT:CREATE',
    EDIT: 'REPORT:EDIT',
    DELETE: 'REPORT:DELETE',
    VIEW: 'REPORT:VIEW',
    EXPORT: 'REPORT:EXPORT',
    SCHEDULE: 'REPORT:SCHEDULE',
  },

  // Time Tracking
  TIME: {
    TRACK: 'TIME:TRACK',
    EDIT_OWN: 'TIME:EDIT_OWN',
    EDIT_ALL: 'TIME:EDIT_ALL',
    APPROVE: 'TIME:APPROVE',
    VIEW_REPORTS: 'TIME:VIEW_REPORTS',
    EXPORT: 'TIME:EXPORT',
  },
} as const;

// Type helpers
export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];
