'use client';

import { useState, useTransition, useRef, useEffect } from "react";
import { markNotificationAsRead } from "@/app/actions";

interface NotificationItem {
  id: string;
  pool_id: string;
  message: string;
}

interface Props {
  initialNotifications: NotificationItem[];
  feedbackAppUrl: string;
}

export default function NotificationsDropdown({ initialNotifications, feedbackAppUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state if initialNotifications props change
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const result = await markNotificationAsRead(id);
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Botón de la Campana */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-500 hover:text-slate-700 bg-white border border-[#D8DADC] rounded-full shadow-sm hover:shadow transition-all focus:outline-none cursor-pointer flex items-center justify-center"
        aria-label="Notificaciones"
      >
        {/* SVG Campana */}
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge de cantidad */}
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-white bg-red-500 rounded-full transform translate-x-1/3 -translate-y-1/3 shadow-sm">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Menú Desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-[#D8DADC] rounded-xl shadow-lg z-50 overflow-hidden origin-top-right animate-scale-in text-slate-700">
          <div className="p-4 bg-[#F7F9FB] border-b border-[#D8DADC] flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#0A192F]">Notificaciones</h3>
            <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 border border-[#D8DADC] rounded-full font-bold">
              {notifications.length} Nuevas
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium italic">
                No hay avisos nuevos.
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                  <p className="text-xs text-slate-600 font-semibold leading-normal">
                    {n.message}
                  </p>
                  <div className="flex gap-2 justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n.id)}
                      disabled={isPending}
                      className="px-2.5 py-1 text-[10px] text-slate-500 hover:text-slate-700 bg-white border border-[#D8DADC] rounded-md transition-all font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Ignorar
                    </button>
                    <a
                      href={`${feedbackAppUrl}?pool_id=${n.pool_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleMarkAsRead(n.id)}
                      className="px-2.5 py-1 text-[10px] text-white bg-[#0A192F] hover:bg-slate-800 rounded-md transition-all font-bold cursor-pointer flex items-center justify-center"
                    >
                      Calificar ★
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.15s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
