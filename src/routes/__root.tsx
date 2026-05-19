import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/layout/navbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ProfileSetupModal } from "@/components/profile-setup-modal";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find that page.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "ZenTurf — Book sports turfs, courts & event halls" },
        {
          name: "description",
          content:
            "Real-time booking for football turfs, badminton courts, auditoriums and more. Live availability, instant confirmation, QR check-in.",
        },
        {
          property: "og:title",
          content: "ZenTurf — Book sports turfs, courts & event halls",
        },
        {
          property: "og:description",
          content:
            "Real-time booking for football turfs, badminton courts, auditoriums and more. Live availability, instant confirmation, QR check-in.",
        },
        { property: "og:type", content: "website" },
        {
          name: "twitter:title",
          content: "ZenTurf — Book sports turfs, courts & event halls",
        },
        {
          name: "twitter:description",
          content:
            "Real-time booking for football turfs, badminton courts, auditoriums and more. Live availability, instant confirmation, QR check-in.",
        },
        {
          property: "og:image",
          content:
            "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/786b3545-9760-44d5-bea5-7b6c3c9a4299/id-preview-d1086ac5--6f6a0ae4-0038-41e6-9156-dd381fa0f2a3.lovable.app-1778430073639.png",
        },
        {
          name: "twitter:image",
          content:
            "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/786b3545-9760-44d5-bea5-7b6c3c9a4299/id-preview-d1086ac5--6f6a0ae4-0038-41e6-9156-dd381fa0f2a3.lovable.app-1778430073639.png",
        },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "stylesheet", href: appCss }],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col pb-16 md:pb-0">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
      <ProfileSetupModal />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
