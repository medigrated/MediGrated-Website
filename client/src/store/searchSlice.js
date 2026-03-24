import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    globalSearchQuery: '',
};

const searchSlice = createSlice({
    name: 'search',
    initialState,
    reducers: {
        setSearchQuery: (state, action) => {
            state.globalSearchQuery = action.payload;
        },
        clearSearchQuery: (state) => {
            state.globalSearchQuery = '';
        }
    }
});

export const { setSearchQuery, clearSearchQuery } = searchSlice.actions;
export default searchSlice.reducer;
