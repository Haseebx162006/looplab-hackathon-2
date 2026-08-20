"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCompany } from "@/context/CompanyContext";
import { ShieldAlert, ArrowRight, Layers } from "lucide-react";
import Link from "next/link";

const PUBLIC_PATHS = ["/", "/login", "/signup"];

export const OnboardingGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, hasCompletedOnboarding } = useCompany();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("agenthack_auth_token") : null;
    const isUserAuth = isAuthenticated || Boolean(token);
    const isOnboardingDone = hasCompletedOnboarding || (typeof window !== "undefined" && localStorage.getItem("agenthack_onboarding_completed") === "true");

    // 1. Logged in user visiting login or signup -> Redirect to dashboard (or onboarding if incomplete)
    if (isUserAuth && (pathname === "/login" || pathname === "/signup")) {
      if (isOnboardingDone) {
        router.replace("/dashboard");
      } else {
        router.replace("/onboarding");
      }
      return;
    }

    // 2. Logged in user who ALREADY completed onboarding trying to re-visit /onboarding -> Redirect to /dashboard
    if (isUserAuth && isOnboardingDone && pathname === "/onboarding") {
      router.replace("/dashboard");
      return;
    }

    // 3. Not logged in user trying to access private routes -> Redirect to /login
    if (!isUserAuth && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/login");
      return;
    }

    // 4. Logged in user on private route without completing onboarding -> Redirect to /onboarding
    if (isUserAuth && !isOnboardingDone && !PUBLIC_PATHS.includes(pathname) && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }
  }, [pathname, isAuthenticated, hasCompletedOnboarding, mounted, router]);

  if (!mounted) return null;

  return <>{children}</>;
};
