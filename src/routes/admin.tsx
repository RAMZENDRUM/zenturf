import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — ZenTurf" }] }),
  component: () => (
    <div className="container mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Admin panel</h1>
      <p className="mt-2 text-muted-foreground">
        Approve venues, process refunds, manage users. Coming in v2.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  ),
});
