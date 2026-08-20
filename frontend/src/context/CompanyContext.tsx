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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("seekh_auth_token");
      const onboarding = localStorage.getItem("seekh_onboarding_completed");
      setIsAuthenticated(Boolean(token));
      setHasCompletedOnboarding(onboarding === "true");
    }
  }, []);

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("seekh_auth_token");
      localStorage.removeItem("seekh_onboarding_completed");
    }
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
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
