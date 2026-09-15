"use client";

import Link from "next/link";
import { Bell, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getIncidentDetailRoute } from "@/lib/incidentRoutes";
import { formatDate } from "@/lib/format";
import { notificationService } from "@/services/notifications";
import type { Notification } from "@/types";

type NotificationBellProps = {
  onOpen?: () => void;
};

export function NotificationBell({ onOpen }: NotificationBellProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const refreshCount = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const data = await notificationService.unreadCount();
      setUnreadCount(data.count);
    } catch {
      // Ignore polling errors silently.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.list();
      setNotifications(data.results.slice(0, 8));
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const first = window.setTimeout(() => { void refreshCount(); }, 0);
    const interval = window.setInterval(() => {
      void refreshCount();
    }, 60000);
    const onVisible = () => { void refreshCount(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, refreshCount]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  async function handleNotificationClick(notification: Notification) {
    if (!notification.is_read) {
      try {
        await notificationService.markRead(notification.id);
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Continue navigation even if mark-read fails.
      }
    }
    setIsOpen(false);
  }

  async function handleMarkAllRead() {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } catch {
      // No-op.
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="notification-panel"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        onClick={() => {
          if (!isOpen) { onOpen?.(); void loadNotifications(); }
          setIsOpen(!isOpen);
        }}
        className="relative inline-flex h-11 min-w-11 justify-center items-center rounded-md px-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-foreground"
      >
        <Bell size={20} aria-hidden="true" /><span className="hidden xl:inline ml-2">Notifications</span>
        {unreadCount > 0 ? (
          <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-sm bg-danger px-1.5 text-[11px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          id="notification-panel"
          className="notification-panel"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex min-h-11 items-center text-xs font-medium text-primary hover:text-primary-dark"
              >
                Mark all read
              </button>
            ) : null}
            <button type="button" aria-label="Close notifications" className="inline-flex min-h-11 min-w-11 items-center justify-center" onClick={() => { setIsOpen(false); buttonRef.current?.focus(); }}><X size={18} aria-hidden="true" /></button>
          </div>

          <div className="notification-list">
            {isLoading ? (
              <p className="px-4 py-6 text-sm text-text-secondary">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-text-secondary">
                No notifications yet. Updates appear here when incident status changes.
              </p>
            ) : (
              notifications.map((notification) => {
                const content = (
                  <div
                    className={`border-b border-border px-4 py-3 last:border-b-0 hover:bg-surface-hover/60 ${
                      notification.is_read ? "" : "bg-primary/5"
                    }`}
                  >
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">{notification.message}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                );

                if (notification.related_incident) {
                  return (
                    <Link
                      key={notification.id}
                      href={getIncidentDetailRoute(user.role, notification.related_incident)}
                      onClick={() => void handleNotificationClick(notification)}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={notification.id}
                    type="button"
                    className="block w-full text-left"
                    onClick={() => void handleNotificationClick(notification)}
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
