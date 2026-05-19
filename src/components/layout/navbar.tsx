import { Link, useNavigate } from "@tanstack/react-router";
import { 
  Book, 
  Menu, 
  Sunset, 
  Trees, 
  Zap, 
  Compass, 
  HelpCircle, 
  Bell, 
  LogOut, 
  Moon, 
  Sun, 
  User as UserIcon 
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FlowButton } from "@/components/ui/flow-button";
import logoImg from "@/assets/zenturf-logo.png";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubMenuItem {
  title: string;
  description: string;
  icon: JSX.Element;
  url: string;
  search?: Record<string, string>;
}

interface MenuItem {
  title: string;
  url?: string;
  items?: SubMenuItem[];
}

  export function Navbar() {
  const { user, role } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfileName(null);
      return;
    }
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      if (data && !error) {
        setProfileName(data.name);
      }
    };
    fetchProfile();

    const channel = supabase
      .channel("navbar-profile")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && "name" in payload.new) {
            setProfileName((payload.new as any).name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    const load = async () => {
      const { count } = await supabase
        .from("zenturf_notifications_v2")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setUnread(count ?? 0);
    };
    load();

    const channel = supabase
      .channel("notif-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
    setIsOpen(false);
  };

  const menu: MenuItem[] = [
    {
      title: "Explore Venues",
      items: [
        {
          title: "Football Turfs",
          description: "Premium grass fields for 5v5, 7v7, or 11v11 matches.",
          icon: <Zap className="size-5 shrink-0 text-primary" />,
          url: "/",
          search: { sport: "Football" },
        },
        {
          title: "Badminton Courts",
          description: "Indoor synthetic or wooden courts with high ceilings.",
          icon: <Sunset className="size-5 shrink-0 text-primary" />,
          url: "/",
          search: { sport: "Badminton" },
        },
        {
          title: "Cricket Nets & Pitches",
          description: "Nets and professional grounds with box cricket options.",
          icon: <Trees className="size-5 shrink-0 text-primary" />,
          url: "/",
          search: { sport: "Cricket" },
        },
        {
          title: "Auditoriums & Halls",
          description: "Perfect settings for tournaments, gatherings, or events.",
          icon: <Book className="size-5 shrink-0 text-primary" />,
          url: "/",
          search: { sport: "Auditorium" },
        },
      ],
    },
    {
      title: "Resources",
      items: [
        {
          title: "About ZenTurf",
          description: "Our mission to simplify sports slots and venue bookings.",
          icon: <Compass className="size-5 shrink-0 text-primary" />,
          url: "/about",
        },
        {
          title: "FAQ & Support",
          description: "Get assistance, resolve payment queries, or contact us.",
          icon: <HelpCircle className="size-5 shrink-0 text-primary" />,
          url: "/support",
        },
        {
          title: "Owner Portal",
          description: "List your club, manage live availability, and track income.",
          icon: <Trees className="size-5 shrink-0 text-primary" />,
          url: "/owner",
        },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-[95%] xl:max-w-[92%] mx-auto px-4">
        {/* Desktop Layout */}
        <nav className="hidden h-16 items-center justify-between lg:flex">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 font-bold shrink-0">
              <img src={logoImg} className="h-9 w-9 object-contain" alt="ZenTurf Logo" />
              <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
                ZenTurf
              </span>
            </Link>

            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                {menu.map((item) => (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:hover:bg-transparent data-[state=open]:focus:bg-transparent px-2.5 h-auto py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground border-none shadow-none outline-none select-none data-[state=open]:text-foreground transition-all duration-200">
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="w-[400px] p-3 grid gap-1">
                        {item.items?.map((subItem) => (
                          <li key={subItem.title}>
                            <Link
                              to={subItem.url as any}
                              search={subItem.search as any}
                              className="flex select-none gap-4 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-muted/80 hover:text-accent-foreground"
                            >
                              {subItem.icon}
                              <div>
                                <div className="text-sm font-semibold tracking-tight text-foreground">
                                  {subItem.title}
                                </div>
                                <p className="text-xs leading-normal text-muted-foreground mt-1">
                                  {subItem.description}
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}

                {user && (
                  <Link
                    to="/dashboard"
                    className="inline-flex h-auto w-max items-center justify-center px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground select-none"
                  >
                    My Bookings
                  </Link>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-9 w-9"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  search={{ tab: "notifications" } as any}
                  className="relative"
                >
                  <Button variant="ghost" size="icon" aria-label="Notifications" className="h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                      <Badge
                        className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-[10px] flex items-center justify-center"
                        variant="destructive"
                      >
                        {unread}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Profile" className="h-9 w-9 rounded-full">
                      <UserIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl">
                    <DropdownMenuLabel className="pb-1 font-semibold text-sm text-foreground truncate">
                      {profileName || user.user_metadata?.name || user.user_metadata?.full_name || "ZenTurf User"}
                    </DropdownMenuLabel>
                    <DropdownMenuLabel className="pt-0 pb-2 font-normal text-xs text-muted-foreground truncate">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })} className="rounded-lg">
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ to: "/owner" })} className="rounded-lg">
                      Owner Portal
                    </DropdownMenuItem>
                    {role === "admin" && (
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin" })} className="rounded-lg">
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive rounded-lg">
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-6 mr-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-all duration-200"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Layout */}
        <div className="flex h-16 items-center justify-between lg:hidden">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <img src={logoImg} className="h-8 w-8 object-contain" alt="ZenTurf Logo" />
            <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-base font-extrabold tracking-tight text-transparent">
              ZenTurf
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-9 w-9"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto w-full sm:max-w-md rounded-l-2xl">
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle>
                    <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                      <img src={logoImg} className="h-8 w-8 object-contain" alt="ZenTurf Logo" />
                      <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
                        ZenTurf
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="my-6 flex flex-col gap-6">
                  <Accordion type="single" collapsible className="flex w-full flex-col gap-3">
                    {menu.map((item) => (
                      <AccordionItem key={item.title} value={item.title} className="border-b-0">
                        <AccordionTrigger className="py-2 text-sm font-semibold hover:no-underline text-foreground">
                          {item.title}
                        </AccordionTrigger>
                        <AccordionContent className="mt-2 pl-2 grid gap-1">
                          {item.items?.map((subItem) => (
                            <Link
                              key={subItem.title}
                              to={subItem.url as any}
                              search={subItem.search as any}
                              onClick={() => setIsOpen(false)}
                              className="flex select-none gap-3 rounded-xl p-2.5 leading-none outline-none transition-colors hover:bg-muted/80"
                            >
                              {subItem.icon}
                              <div>
                                <div className="text-xs font-bold text-foreground">{subItem.title}</div>
                                <p className="text-[11px] leading-normal text-muted-foreground mt-0.5">
                                  {subItem.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    
                    {user && (
                      <Link
                        to="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="py-2 text-sm font-semibold hover:no-underline text-foreground"
                      >
                        My Bookings
                      </Link>
                    )}
                  </Accordion>

                  <div className="border-t border-border/65 pt-6 mt-2 flex flex-col gap-3">
                    {user ? (
                      <div className="flex flex-col gap-3">
                        <div className="px-3 py-2 bg-muted/40 rounded-xl">
                          <p className="text-xs text-muted-foreground font-medium">Logged in as</p>
                          <p className="text-xs font-bold text-foreground truncate mt-0.5">{user.email}</p>
                        </div>
                        <Button asChild variant="outline" className="w-full justify-start rounded-xl" onClick={() => setIsOpen(false)}>
                          <Link to="/dashboard">Go to Dashboard</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start rounded-xl" onClick={() => setIsOpen(false)}>
                          <Link to="/owner">List a Turf (Owner Portal)</Link>
                        </Button>
                        <Button variant="destructive" className="w-full justify-start rounded-xl gap-2" onClick={signOut}>
                          <LogOut className="h-4 w-4" /> Sign out
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <Link
                          to="/login"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full h-11 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all duration-200"
                        >
                          Log in
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center w-full h-11 px-4 text-sm font-semibold text-foreground hover:text-primary hover:bg-muted/50 rounded-xl transition-all duration-200"
                        >
                          Sign up
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
