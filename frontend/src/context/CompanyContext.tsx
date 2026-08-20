"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CompanyContextType {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  setIsAuthenticated: (val: boolean) => void;
  setHasCompletedOnboarding: (val: boolean) => void;
  logout: () => void;
}

const CompanyContext = createContext<CompanyContextType>({
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  setIsAuthenticated: () => {},
  setHasCompletedOnboarding: () => {},
  logout: () => {},
});

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticatedState] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("seekh_auth_token");
      const onboarding = localStorage.getItem("seekh_onboarding_completed");
      setIsAuthenticatedState(Boolean(token));
      setHasCompletedOnboardingState(onboarding === "true");
    }
  }, []);

  const setIsAuthenticated = (val: boolean) => {
    setIsAuthenticatedState(val);
    if (typeof window !== "undefined" && !val) {
      localStorage.removeItem("seekh_auth_token");
    }
  };

  const setHasCompletedOnboarding = (val: boolean) => {
    setHasCompletedOnboardingState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("seekh_onboarding_completed", String(val));
    }
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("seekh_auth_token");
      localStorage.removeItem("seekh_onboarding_completed");
      // Force a hard reload/navigation to clear all in-memory Redux and RTK Query cache states
      window.location.href = "/login";
    }
    setIsAuthenticatedState(false);
    setHasCompletedOnboardingState(false);
  };

  return (
    <CompanyContext.Provider
      value={{
        isAuthenticated,
        hasCompletedOnboarding,
        setIsAuthenticated,
        setHasCompletedOnboarding,
        logout,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
