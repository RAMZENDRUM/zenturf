import { Link } from "@tanstack/react-router";
import { Home, Search, CalendarDays, Bell, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function MobileBottomNav() {
  const { user } = useAuth();
  const items: Array<{
    to: string;
    label: string;
    icon: typeof Home;
    exact?: boolean;
  }> = [
    { to: "/", label: "Home", icon: Home, exact: true },
    { to: "/", label: "Search", icon: Search, exact: true },
    {
      to: user ? "/dashboard" : "/login",
      label: "Bookings",
      icon: CalendarDays,
    },
    { to: user ? "/dashboard" : "/login", label: "Alerts", icon: Bell },
    { to: user ? "/dashboard" : "/login", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((it, i) => (
          <li key={i}>
            <Link
              to={it.to}
              className="flex flex-col items-center gap-1 py-2 text-[10px] text-muted-foreground"
              activeProps={{
                className:
                  "flex flex-col items-center gap-1 py-2 text-[10px] text-primary",
              }}
              activeOptions={it.exact ? { exact: true } : undefined}
            >
              <it.icon className="h-5 w-5" />
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
