"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "success" | "error" | "info";

type Notification = {
  id: number;
  title: string;
  message?: string;
  type: NotificationType;
};

type NotifyOptions = {
  title: string;
  message?: string;
  type?: NotificationType;
  duration?: number;
};

type NotificationContextValue = {
  notify: (options: NotifyOptions) => void;
  dismiss: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const notificationStyles: Record<NotificationType, { icon: typeof CheckCircle2; accent: string }> = {
  success: { icon: CheckCircle2, accent: "text-emerald-600 dark:text-emerald-300" },
  error: { icon: AlertCircle, accent: "text-rose-600 dark:text-rose-300" },
  info: { icon: Info, accent: "text-sky-600 dark:text-sky-300" },
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [duration, setDuration] = useState(4500);

  const dismiss = useCallback(() => setNotification(null), []);

  const notify = useCallback((options: NotifyOptions) => {
    setDuration(options.duration ?? 4500);
    setNotification({
      id: Date.now(),
      title: options.title,
      message: options.message,
      type: options.type ?? "info",
    });
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timeout = window.setTimeout(dismiss, duration);
    return () => window.clearTimeout(timeout);
  }, [dismiss, duration, notification]);

  const value = useMemo(() => ({ notify, dismiss }), [dismiss, notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast notification={notification} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}

function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: Notification | null;
  onDismiss: () => void;
}) {
  if (!notification) return null;

  const { icon: Icon, accent } = notificationStyles[notification.type];

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end">
      <div
        key={notification.id}
        role={notification.type === "error" ? "alert" : "status"}
        className="notification-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border border-white/60 bg-white/80 p-3.5 shadow-[0_18px_50px_-20px_rgb(36_52_120_/_0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75"
      >
        <span className={cn("mt-0.5 shrink-0", accent)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{notification.title}</p>
          {notification.message && (
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {notification.message}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-sky-400 via-primary to-indigo-400" aria-hidden="true" />
      </div>
    </div>
  );
}