import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SocialLink = { icon: string; url: string; label?: string };

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  socials: SocialLink[];
  is_founder: boolean;
  sort_order: number;
};

export function useTeam() {
  const qc = useQueryClient();
  const key = ["team_members"];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("team_members")
        .select("*")
        .order("is_founder", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((m: any) => ({
        ...m,
        socials: Array.isArray(m.socials) ? m.socials : [],
      })) as TeamMember[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`team_members_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "team_members" },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data: query.data ?? [], isLoading: query.isLoading };
}
