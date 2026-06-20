import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SocialLink = { icon: string; url: string; label: string };
export type HourEntry = { days: string; hours: string };
export type EducationEntry = {
  title: string;
  institution: string;
  startYear: string;
  endYear: string;
  description: string;
};

export type GeneralContent = {
  phone: string;
  phoneHref: string;
  email: string;
  socials: SocialLink[];
};

export type ContactContent = {
  address: string;
  mapsUrl: string;
  hours: HourEntry[];
  extraPhones: { label: string; value: string }[];
  extraEmails: { label: string; value: string }[];
};

export type CvContent = {
  photoUrl: string;
  name: string;
  role: string;
  linkedin: string;
  phone: string;
  email: string;
  about: string;
  education: EducationEntry[];
};

export type SectionMap = {
  general: GeneralContent;
  contact: ContactContent;
  cv: CvContent;
};

export const DEFAULTS: SectionMap = {
  general: {
    phone: "+34 645 04 16 64",
    phoneHref: "tel:+34645041664",
    email: "info@avendanoserrano.es",
    socials: [
      { icon: "facebook", url: "https://www.facebook.com/danialejoserrano", label: "Facebook" },
      { icon: "instagram", url: "https://instagram.com/_danialejo_", label: "Instagram" },
      { icon: "linkedin", url: "https://linkedin.com", label: "LinkedIn" },
    ],
  },
  contact: {
    address: "",
    mapsUrl: "",
    hours: [],
    extraPhones: [],
    extraEmails: [],
  },
  cv: {
    photoUrl: "",
    name: "",
    role: "",
    linkedin: "",
    phone: "",
    email: "",
    about: "",
    education: [],
  },
};

export function useSiteContent<K extends keyof SectionMap>(section: K) {
  const qc = useQueryClient();
  const key = ["site_content", section];

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("site_content")
        .select("data")
        .eq("section", section)
        .maybeSingle();
      if (error) throw error;
      return { ...DEFAULTS[section], ...((data?.data as object) || {}) } as SectionMap[K];
    },
  });

  useEffect(() => {
    const channel = supabase.channel(`site_content_${section}_${Math.random().toString(36).slice(2)}`);
    channel
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "site_content", filter: `section=eq.${section}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return { data: (query.data ?? DEFAULTS[section]) as SectionMap[K], isLoading: query.isLoading };
}

export async function saveSiteContent<K extends keyof SectionMap>(
  section: K,
  data: SectionMap[K],
) {
  const { error } = await (supabase as any)
    .from("site_content")
    .upsert({ section, data }, { onConflict: "section" });
  if (error) throw error;
}
