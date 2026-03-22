// client/src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice/authSlice';
import activityReducer from './activitySlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        activity: activityReducer,
    },
});

export default store;
export { store };