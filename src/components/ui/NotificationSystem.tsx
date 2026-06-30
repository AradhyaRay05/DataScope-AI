"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextValue {
  notify: (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  return ctx;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (
      type: NotificationType,
      title: string,
      message?: string,
      duration = 5000
    ) => {
      const id = `notif-${++counterRef.current}`;
      setNotifications((prev) => [
        ...prev.slice(-4),
        { id, type, title, message, duration },
      ]);
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string) => notify("success", title, message),
    [notify]
  );
  const error = useCallback(
    (title: string, message?: string) =>
      notify("error", title, message, 8000),
    [notify]
  );
  const warning = useCallback(
    (title: string, message?: string) => notify("warning", title, message, 6000),
    [notify]
  );
  const info = useCallback(
    (title: string, message?: string) => notify("info", title, message),
    [notify]
  );

  return (
    <NotificationContext.Provider
      value={{ notify, success, error, warning, info, dismiss }}
    >
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map((n) => (
          <NotificationToast key={n.id} notification={n} onDismiss={dismiss} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

const ICONS: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  error: <AlertCircle className="w-5 h-5 text-red-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
  info: <Info className="w-5 h-5 text-blue-400" />,
};

const BG_COLORS: Record<NotificationType, string> = {
  success: "border-emerald-500/20 bg-emerald-500/5",
  error: "border-red-500/20 bg-red-500/5",
  warning: "border-yellow-500/20 bg-yellow-500/5",
  info: "border-blue-500/20 bg-blue-500/5",
};

function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(
      () => {
        setVisible(false);
        setTimeout(() => onDismiss(notification.id), 300);
      },
      notification.duration ?? 5000
    );
    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onDismiss]);

  return (
    <div
      className={`pointer-events-auto transform transition-all duration-300 ease-out ${
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`rounded-xl border backdrop-blur-xl p-4 shadow-2xl ${BG_COLORS[notification.type]}`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">{ICONS[notification.type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white font-[family-name:var(--font-instrument-sans)]">
              {notification.title}
            </p>
            {notification.message && (
              <p className="text-xs text-white/50 mt-1 font-[family-name:var(--font-instrument-sans)]">
                {notification.message}
              </p>
            )}
          </div>
          <button
            onClick={() => onDismiss(notification.id)}
            className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
