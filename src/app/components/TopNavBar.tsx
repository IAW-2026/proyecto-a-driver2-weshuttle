'use client';

import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import NotificationsDropdown from "./NotificationsDropdown";

interface NotificationItem {
  id: string;
  pool_id: string;
  message: string;
}

interface TopNavBarProps {
  backUrl?: string;
  backLabel?: string;
  notifications?: NotificationItem[];
  feedbackAppUrl?: string;
  role?: string;
  displayName?: string | null;
}

export default function TopNavBar({
  backUrl,
  backLabel,
  notifications,
  feedbackAppUrl,
  role,
  displayName,
}: TopNavBarProps) {
  const { user, isSignedIn } = useUser();

  const userRole = role || (user?.publicMetadata?.role as string) || "Conductor";
  const name = displayName?.trim() || user?.firstName || "Usuario";

  const homeHref = userRole === "admin" ? "/admin/dashboard" : "/";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[var(--ws-outline)] shadow-[0_2px_12px_rgba(10,25,47,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Left Side: Brand Logo and Title */}
        <Link href={homeHref} className="flex items-center gap-3 hover:opacity-85 transition-opacity">
          <div className="flex items-center justify-center w-11 h-11 bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-1.5 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 22 34 L 35 75 L 50 45 L 65 75 L 78 34"
                fill="none"
                stroke="#0c59cf"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="22" cy="30" r="8.5" fill="#e63946" />
              <circle cx="50" cy="40" r="8.5" fill="#f59e0b" />
              <circle cx="78" cy="30" r="8.5" fill="#10b981" />
            </svg>
          </div>
          <span className="ws-brand">
            WeShuttle
          </span>
        </Link>

        {/* Right Side: Back button, Notifications and User Profile */}
        <div className="flex items-center gap-4 sm:gap-6">
          {backUrl && (
            <Link
              href={backUrl}
              className="text-xs font-bold text-[#0A192F] hover:text-[#4B5563] bg-slate-50 hover:bg-slate-100 border border-[#D8DADC] px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
              <span className="hidden sm:inline">{backLabel || "Volver"}</span>
            </Link>
          )}

          {notifications && feedbackAppUrl && (
            <NotificationsDropdown
              initialNotifications={notifications}
              feedbackAppUrl={feedbackAppUrl}
            />
          )}

          {isSignedIn && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[var(--ws-midnight)]">
                  {name}
                </p>
                <p className="text-xs text-[var(--ws-slate)] uppercase tracking-wider font-semibold text-[10px]">
                  {userRole}
                </p>
              </div>
              <UserButton />
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
