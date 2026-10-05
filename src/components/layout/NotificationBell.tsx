import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import { relativeTime } from "@/utils/format";

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => listNotifications(userId as string),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });

  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              onClick={async () => {
                if (!userId) return;
                await markAllNotificationsRead(userId);
                void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
              }}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              You have no notifications yet.
            </p>
          ) : (
            notifications.slice(0, 8).map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={async () => {
                  if (!notification.is_read) {
                    await markNotificationRead(notification.id);
                    void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
                  }
                }}
                className={`flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-muted ${
                  notification.is_read ? "" : "bg-primary-soft/50"
                }`}
              >
                <span className="text-sm font-medium text-foreground">{notification.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {notification.message}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {relativeTime(notification.created_at)}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link to="/notifications">View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
