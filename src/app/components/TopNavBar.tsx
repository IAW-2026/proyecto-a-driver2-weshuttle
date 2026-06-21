'use client';

import { UserButton } from "@clerk/nextjs";
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
}

export default function TopNavBar({
  backUrl,
  backLabel,
  notifications,
  feedbackAppUrl,
}: TopNavBarProps) {
  return (
    <nav className="bg-white border-b border-[#D8DADC] shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] py-3.5 px-4 sm:px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left Side: Brand Logo and Title */}
        <Link href="/" className="flex items-center gap-2.5 group transition-opacity hover:opacity-90">
          <img
            src="/logo-ws-recortado.jpeg"
            alt="WeShuttle Logo"
            className="h-10 w-10 object-contain rounded-md"
          />
          <span className="text-xl font-bold tracking-tight text-[#0A192F] font-sans">
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

          <div className="flex items-center shrink-0">
            <UserButton />
          </div>
        </div>

      </div>
    </nav>
  );
}
