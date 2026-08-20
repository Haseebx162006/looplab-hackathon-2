"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
}

const getInitialState = (): AuthState => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("seekh_auth_token");
    const onboarding = localStorage.getItem("seekh_onboarding_completed");
    return {
      token,
      isAuthenticated: Boolean(token),
      hasCompletedOnboarding: onboarding === "true",
    };
  }
  return {
    token: null,
    isAuthenticated: false,
    hasCompletedOnboarding: false,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; hasCompletedOnboarding?: boolean }>
    ) => {
      const { token, hasCompletedOnboarding = true } = action.payload;
      state.token = token;
      state.isAuthenticated = true;
      state.hasCompletedOnboarding = hasCompletedOnboarding;
      if (typeof window !== "undefined") {
        localStorage.setItem("seekh_auth_token", token);
        localStorage.setItem("seekh_onboarding_completed", String(hasCompletedOnboarding));
      }
    },
    logoutUser: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.hasCompletedOnboarding = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("seekh_auth_token");
        localStorage.removeItem("seekh_onboarding_completed");
      }
    },
    setOnboardingComplete: (state) => {
      state.hasCompletedOnboarding = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("seekh_onboarding_completed", "true");
      }
    },
  },
});

export const { setCredentials, logoutUser, setOnboardingComplete } = authSlice.actions;
export default authSlice.reducer;
