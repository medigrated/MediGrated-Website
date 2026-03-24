// client/src/store/authSlice/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
};

export const registerUser = createAsyncThunk(
    '/auth/register',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', formData, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Something went wrong' });
        }
    }
);
//what this does is, it creates an async thunk action called registerUser that sends a POST request to the server to register a new user, and handles success and error cases. 
//The withCredentials: true option is included to allow sending cookies if needed.
//The rejectWithValue function is used to pass custom error payloads to the rejected action.//This is useful for providing more detailed error information to the reducers.
//The error.response?.data || { message: 'Something went wrong' } expression ensures that if the server provides an error response, it is used; otherwise, a generic error message is returned.


export const loginUser = createAsyncThunk(
    '/auth/login',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', formData, {
                withCredentials: true,
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Something went wrong' });
        }
    }
);
//what this does is, it creates an async thunk action called loginUser that sends a POST request to the server to log in a user, and handles success and error cases.
//The withCredentials: true option is included to allow sending cookies if needed.
//The rejectWithValue function is used to pass custom error payloads to the rejected action.//This is useful for providing more detailed error information to the reducers.
//The error.response?.data || { message: 'Something went wrong' } expression ensures that if the server provides an error response, it is used; otherwise, a generic error message is returned.


export const checkAuth = createAsyncThunk(
    '/auth/check-auth',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('http://localhost:5000/api/auth/check-auth', {
                withCredentials: true,
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                },
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Something went wrong' });
        }
    }
);
//what this does is, it creates an async thunk action called checkAuth that sends a GET request to the server to verify if the user is authenticated, and handles success and error cases.
//The withCredentials: true option is included to allow sending cookies if needed.
//The headers option with 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' is added to prevent caching of the response, ensuring that the authentication status is always checked against the server.
//The rejectWithValue function is used to pass custom error payloads to the rejected action.//This is useful for providing more detailed error information to the reducers.
//The error.response?.data || { message: 'Something went wrong' } expression ensures that if the server provides an error response, it is used; otherwise, a generic error message is returned.


export const logoutUser = createAsyncThunk(
    '/auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/logout', {}, {
                withCredentials: true,
            });
            return response.data;
        }
        catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Something went wrong' });
        }
    }
);
//what this does is, it creates an async thunk action called logoutUser that sends a POST request to the server to log out the user, and handles success and error cases.
//The withCredentials: true option is included to allow sending cookies if needed.
//The rejectWithValue function is used to pass custom error payloads to the rejected action.//This is useful for providing more detailed error information to the reducers.
//The error.response?.data || { message: 'Something went wrong' } expression ensures that if the server provides an error response, it is used; otherwise, a generic error message is returned.
//when the user logs out, the server clears the authentication cookie, effectively logging the user out on the client side as well.


const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            } else {
                state.user = action.payload;
            }
        }
    },
    extraReducers: (builder) => {
        builder.addCase(registerUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
            //what this does is, when the request is sent, it sets loading to true and clears any previous errors
        }).addCase(registerUser.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = action.payload.success;
            state.user = action.payload.user;
            state.error = null;
            //currently logging in user immediately after registration
            //for directly logging in after registration
            // state.isAuthenticated = true;
            // state.user = action.payload.user;
            //what this does is, when the request is successful, it sets loading to false, marks the user as authenticated, and stores the user data
        }).addCase(registerUser.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload?.message || 'Failed to register';
            state.isAuthenticated = false;
            state.user = null;
            //what this does is, if the request fails, it sets loading to false and stores the error message
        }).addCase(loginUser.pending, (state) => {
            state.isLoading = true;
            state.error = null;
            //what this does is, when the request is sent, it sets loading to true and clears any previous errors
        }).addCase(loginUser.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = action.payload.success;
            state.user = action.payload.user;
            state.error = null;
            //what this does is, when the request is successful, it sets loading to false, marks the user as authenticated, and stores the user data
        }).addCase(loginUser.rejected, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.error = action.payload?.message || 'Failed to login';
            //what this does is, if the request fails, it sets loading to false and stores the error message
        }).addCase(checkAuth.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        }).addCase(checkAuth.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = action.payload.success;
            state.user = action.payload.user;
            state.error = null;
        }).addCase(checkAuth.rejected, (state, action) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.error = action.payload?.message || 'Authentication failed';
        }).addCase(logoutUser.pending, (state) => {
            state.isLoading = true;
        }).addCase(logoutUser.fulfilled, (state) => {
            state.isLoading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.error = null;
        }).addCase(logoutUser.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload?.message || 'Failed to log out';
        });
    }
});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;