import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/owner")({
  head: () => ({ meta: [{ title: "Owner portal — ZenTurf" }] }),
  component: () => (
    <div className="container mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Owner portal</h1>
      <p className="mt-2 text-muted-foreground">
        List your venue, manage slots, view analytics. Coming in v2.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  ),
});
