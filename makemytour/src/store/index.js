import { configureStore, createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,   // never load from localStorage here
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(action.payload));
      }
    },
    loadUserFromLocalStorage: (state) => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("user");
        if (saved) {
          state.user = JSON.parse(saved);
        }
      }
    },
    clearUser: (state) => {
      state.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    },
  },
});

export const { setUser, clearUser, loadUserFromLocalStorage } =
  userSlice.actions;

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
  },
});

export default store;
