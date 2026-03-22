import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activities: [],
  filters: {
    type: 'all',
    user: 'all',
  },
};

export const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    // Add a new activity
    addActivity: (state, action) => {
      const activity = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.activities.unshift(activity);
      // Keep only last 1000 activities
      if (state.activities.length > 1000) {
        state.activities.pop();
      }
    },

    // Clear all activities
    clearActivities: (state) => {
      state.activities = [];
    },

    // Delete specific activity
    deleteActivity: (state, action) => {
      state.activities = state.activities.filter((activity) => activity.id !== action.payload);
    },

    // Set filter type
    setActivityFilter: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    // Reset filters
    resetActivityFilters: (state) => {
      state.filters = {
        type: 'all',
        user: 'all',
      };
    },

    // Bulk add activities (for initialization)
    setActivities: (state, action) => {
      state.activities = action.payload;
    },
  },
});

export const {
  addActivity,
  clearActivities,
  deleteActivity,
  setActivityFilter,
  resetActivityFilters,
  setActivities,
} = activitySlice.actions;

export default activitySlice.reducer;

// Selectors
export const selectActivities = (state) => state.activity.activities;
export const selectActivityFilters = (state) => state.activity.filters;
export const selectFilteredActivities = (state) => {
  const { activities, filters } = state.activity;
  return activities.filter((activity) => {
    if (filters.type !== 'all' && activity.type !== filters.type) return false;
    if (filters.user !== 'all' && activity.user !== filters.user) return false;
    return true;
  });
};
