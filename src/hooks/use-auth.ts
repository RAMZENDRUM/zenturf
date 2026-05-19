import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "owner" | "user" | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchRole = async (userId: string) => {
      setRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (active) {
          if (data && !error && data.length > 0) {
            const roleList = data.map((r: any) => r.role);
            if (roleList.includes("admin")) {
              setRole("admin");
            } else if (roleList.includes("owner")) {
              setRole("owner");
            } else {
              setRole("user");
            }
          } else {
            setRole("user"); // Default fallback
          }
        }
      } catch (err) {
        if (active) setRole("user");
      } finally {
        if (active) setRoleLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchRole(s.user.id);
        } else {
          setRole(null);
          setRoleLoading(false);
        }
      }
    });

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        if (active) {
          setSession(s);
          setUser(s?.user ?? null);
          setLoading(false);
          if (s?.user) {
            fetchRole(s.user.id);
          } else {
            setRole(null);
            setRoleLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error("useAuth getSession error:", err);
        if (active) {
          setSession(null);
          setUser(null);
          setLoading(false);
          setRole(null);
          setRoleLoading(false);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, role, loading, roleLoading };
}
