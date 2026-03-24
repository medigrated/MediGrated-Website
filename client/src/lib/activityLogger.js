// client/src/lib/activityLogger.js

/**
 * Activity Logger Utility
 * Used throughout the app to track and log user activities
 */

export const ACTIVITY_TYPES = {
  // Auth activities
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',

  // Profile activities
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  AVATAR_UPLOAD: 'AVATAR_UPLOAD',
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',

  // Data activities
  HEALTH_DATA_ADD: 'HEALTH_DATA_ADD',
  HEALTH_DATA_UPDATE: 'HEALTH_DATA_UPDATE',
  HEALTH_DATA_DELETE: 'HEALTH_DATA_DELETE',
  REPORT_UPLOAD: 'REPORT_UPLOAD',
  REPORT_SCAN: 'REPORT_SCAN',

  // Family activities
  FAMILY_MEMBER_ADD: 'FAMILY_MEMBER_ADD',
  FAMILY_MEMBER_UPDATE: 'FAMILY_MEMBER_UPDATE',
  FAMILY_MEMBER_REMOVE: 'FAMILY_MEMBER_REMOVE',

  // Patient activities
  PATIENT_ADD: 'PATIENT_ADD',
  PATIENT_UPDATE: 'PATIENT_UPDATE',
  PATIENT_REMOVE: 'PATIENT_REMOVE',

  // Doctor activities
  DOCTOR_ADD: 'DOCTOR_ADD',
  DOCTOR_UPDATE: 'DOCTOR_UPDATE',
  DOCTOR_REMOVE: 'DOCTOR_REMOVE',

  // Chat activities
  CHAT_MESSAGE_SEND: 'CHAT_MESSAGE_SEND',
  CHATBOT_INTERACTION: 'CHATBOT_INTERACTION',

  // Recommendation activities
  RECOMMENDATION_CREATE: 'RECOMMENDATION_CREATE',
  RECOMMENDATION_UPDATE: 'RECOMMENDATION_UPDATE',
  RECOMMENDATION_MARK_COMPLETE: 'RECOMMENDATION_MARK_COMPLETE',

  // Alert activities
  ALERT_CREATE: 'ALERT_CREATE',
  ALERT_ACKNOWLEDGE: 'ALERT_ACKNOWLEDGE',

  // System activities
  SETTINGS_CHANGE: 'SETTINGS_CHANGE',
  LOCATION_ADD: 'LOCATION_ADD',
  LOCATION_UPDATE: 'LOCATION_UPDATE',
  LOCATION_DELETE: 'LOCATION_DELETE',
};

export const ACTIVITY_ICONS = {
  LOGIN: '🔑',
  LOGOUT: '🚪',
  REGISTER: '📝',
  PROFILE_UPDATE: '👤',
  AVATAR_UPLOAD: '📸',
  SETTINGS_UPDATE: '⚙️',
  HEALTH_DATA_ADD: '💊',
  HEALTH_DATA_UPDATE: '📊',
  HEALTH_DATA_DELETE: '🗑️',
  REPORT_UPLOAD: '📄',
  REPORT_SCAN: '🔍',
  FAMILY_MEMBER_ADD: '👥',
  FAMILY_MEMBER_UPDATE: '👥',
  FAMILY_MEMBER_REMOVE: '❌',
  PATIENT_ADD: '🩺',
  PATIENT_UPDATE: '🩺',
  PATIENT_REMOVE: '🗑️',
  DOCTOR_ADD: '👨‍⚕️',
  DOCTOR_UPDATE: '👨‍⚕️',
  DOCTOR_REMOVE: '❌',
  CHAT_MESSAGE_SEND: '💬',
  CHATBOT_INTERACTION: '🤖',
  RECOMMENDATION_CREATE: '💡',
  RECOMMENDATION_UPDATE: '💡',
  RECOMMENDATION_MARK_COMPLETE: '✅',
  ALERT_CREATE: '🔔',
  ALERT_ACKNOWLEDGE: '👍',
  SETTINGS_CHANGE: '⚙️',
  LOCATION_ADD: '📍',
  LOCATION_UPDATE: '📍',
  LOCATION_DELETE: '🗑️',
};

export const ACTIVITY_DESCRIPTIONS = {
  LOGIN: 'Logged in to their account',
  LOGOUT: 'Logged out of their account',
  REGISTER: 'Registered a new account',
  PASSWORD_CHANGE: 'Changed account password',
  PROFILE_UPDATE: 'Updated their profile information',
  AVATAR_UPLOAD: 'Uploaded a new profile picture',
  SETTINGS_UPDATE: 'Updated their settings',
  HEALTH_DATA_ADD: 'Added new health data',
  HEALTH_DATA_UPDATE: 'Updated health data',
  HEALTH_DATA_DELETE: 'Deleted health data',
  REPORT_UPLOAD: 'Uploaded a medical report',
  REPORT_SCAN: 'Scanned a medical report',
  FAMILY_MEMBER_ADD: 'Added a family member',
  FAMILY_MEMBER_UPDATE: 'Updated family member information',
  FAMILY_MEMBER_REMOVE: 'Removed a family member',
  PATIENT_ADD: 'Added a new patient',
  PATIENT_UPDATE: 'Updated patient information',
  PATIENT_REMOVE: 'Removed a patient',
  DOCTOR_ADD: 'Added a new doctor',
  DOCTOR_UPDATE: 'Updated doctor information',
  DOCTOR_REMOVE: 'Removed a doctor',
  CHAT_MESSAGE_SEND: 'Sent a chat message',
  CHATBOT_INTERACTION: 'Interacted with chatbot',
  RECOMMENDATION_CREATE: 'Created a recommendation',
  RECOMMENDATION_UPDATE: 'Updated a recommendation',
  RECOMMENDATION_MARK_COMPLETE: 'Marked recommendation as complete',
  ALERT_CREATE: 'Created an alert',
  ALERT_ACKNOWLEDGE: 'Acknowledged an alert',
  SETTINGS_CHANGE: 'Changed system settings',
  LOCATION_ADD: 'Added a new location',
  LOCATION_UPDATE: 'Updated location information',
  LOCATION_DELETE: 'Deleted a location',
};

/**
 * Create activity object
 * @param {string} type - Activity type from ACTIVITY_TYPES
 * @param {object} options - Additional options
 * @returns {object} Activity object
 */
export const createActivity = (type, options = {}) => {
  return {
    type,
    icon: ACTIVITY_ICONS[type] || '📌',
    description: ACTIVITY_DESCRIPTIONS[type] || 'Activity performed',
    details: options.details || '',
    metadata: options.metadata || {},
    user: options.user || 'User',
    userName: options.userName || 'Unknown User',
    userRole: options.userRole || 'user',
    userId: options.userId || null,
    ...options,
  };
};

/**
 * Format activity timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time string
 */
export const formatActivityTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  } else if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Format activity for display
 * @param {object} activity - Activity object
 * @returns {object} Formatted activity
 */
export const formatActivity = (activity) => {
  return {
    ...activity,
    timeDisplay: formatActivityTime(activity.timestamp),
    dateDisplay: new Date(activity.timestamp).toLocaleDateString(),
    timeFullDisplay: new Date(activity.timestamp).toLocaleString(),
  };
};
