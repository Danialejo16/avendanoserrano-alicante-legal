import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Scale } from "lucide-react";
import { useTeam } from "@/hooks/use-team";

const TeamSection = () => {
  const { t } = useTranslation();
  const { data: members } = useTeam();

  const preview = members.slice(0, 4);

  return (
    <section id="equipo" className="section-padding bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-highlight" />
            <span className="text-highlight text-sm tracking-[0.3em] uppercase font-body">
              {t("teamSection.tagline", "Nuestro equipo")}
            </span>
            <div className="w-8 h-[2px] bg-highlight" />
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary mb-4">
            {t("teamSection.title", "Conozca a los profesionales del despacho")}
          </h2>
          <p className="font-body text-base text-foreground/70 max-w-2xl mx-auto">
            {t("teamSection.subtitle", "Abogados comprometidos con la excelencia y la atención personalizada.")}
          </p>
        </div>

        {preview.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
            {preview.map((m) => (
              <Link
                key={m.id}
                to="/equipo"
                className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-secondary/40"
              >
                {m.photo_url ? (
                  <img
                    src={m.photo_url}
                    alt={m.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Scale className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary via-primary/80 to-transparent p-4 pt-10">
                  <p className="font-heading text-sm md:text-base font-semibold text-primary-foreground line-clamp-1">
                    {m.name}
                  </p>
                  {m.role && (
                    <p className="font-body text-xs text-highlight-light line-clamp-1">{m.role}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link
            to="/equipo"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3 rounded font-semibold hover:opacity-90 transition-opacity"
          >
            {t("teamSection.cta", "Ver todo el equipo")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
