// client/src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice/authSlice';
import activityReducer from './activitySlice';
import searchReducer from './searchSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        activity: activityReducer,
        search: searchReducer,
    },
});

export default store;
export { store };