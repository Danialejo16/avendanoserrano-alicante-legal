import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Linkedin, Facebook, Instagram, Twitter, Globe, Scale, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useTeam, type TeamMember, type SocialLink } from "@/hooks/use-team";

const socialIcon = (icon: string) => {
  const key = icon.toLowerCase();
  if (key.includes("linkedin")) return Linkedin;
  if (key.includes("facebook")) return Facebook;
  if (key.includes("instagram")) return Instagram;
  if (key.includes("twitter") || key.includes("x")) return Twitter;
  return Globe;
};

const SocialButtons = ({ socials, linkedin }: { socials: SocialLink[]; linkedin?: string | null }) => {
  const all: SocialLink[] = [];
  if (linkedin) all.push({ icon: "linkedin", url: linkedin, label: "LinkedIn" });
  socials.forEach((s) => all.push(s));
  if (!all.length) return null;
  return (
    <div className="flex gap-2 flex-wrap">
      {all.map((s, i) => {
        const Icon = socialIcon(s.icon);
        return (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label || s.icon}
            className="w-9 h-9 rounded-full border border-border bg-secondary/40 hover:bg-highlight hover:text-accent-foreground hover:border-highlight flex items-center justify-center transition-colors"
          >
            <Icon className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
};

const FounderCard = ({ m, t }: { m: TeamMember; t: any }) => (
  <article className="relative bg-gradient-to-br from-primary to-navy-deep text-primary-foreground rounded-2xl overflow-hidden border border-highlight/20 shadow-xl">
    <div className="absolute top-5 right-5 inline-flex items-center gap-1.5 bg-highlight text-accent-foreground px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider z-10">
      <Crown className="w-3.5 h-3.5" />
      {t("team.founder", "Fundador")}
    </div>
    <div className="grid md:grid-cols-[320px_1fr] gap-0">
      <div className="relative aspect-square md:aspect-auto md:min-h-[380px] bg-navy-deep">
        {m.photo_url ? (
          <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Scale className="w-20 h-20 text-highlight-light/40" />
          </div>
        )}
      </div>
      <div className="p-8 md:p-10 flex flex-col justify-center">
        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-2">{m.name}</h2>
        {m.role && (
          <p className="text-highlight-light font-body text-base md:text-lg mb-5 tracking-wide">{m.role}</p>
        )}
        {m.bio && (
          <p className="font-body text-primary-foreground/80 leading-relaxed mb-6 whitespace-pre-line">{m.bio}</p>
        )}
        <div className="space-y-2 mb-6 text-sm font-body">
          {m.phone && (
            <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-highlight-light transition-colors" dir="ltr">
              <Phone className="w-4 h-4 text-highlight" /> {m.phone}
            </a>
          )}
          {m.email && (
            <a href={`mailto:${m.email}`} className="flex items-center gap-2 hover:text-highlight-light transition-colors" dir="ltr">
              <Mail className="w-4 h-4 text-highlight" /> {m.email}
            </a>
          )}
        </div>
        <SocialButtons socials={m.socials} linkedin={m.linkedin_url} />
      </div>
    </div>
  </article>
);

const MemberCard = ({ m }: { m: TeamMember }) => (
  <article className="group bg-card border border-border rounded-xl overflow-hidden hover:border-highlight/40 hover:shadow-lg transition-all">
    <div className="aspect-[4/5] bg-secondary/40 overflow-hidden">
      {m.photo_url ? (
        <img
          src={m.photo_url}
          alt={m.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Scale className="w-14 h-14 text-muted-foreground/30" />
        </div>
      )}
    </div>
    <div className="p-5">
      <h3 className="font-heading text-lg font-semibold text-foreground">{m.name}</h3>
      {m.role && <p className="text-highlight font-body text-sm mb-3">{m.role}</p>}
      {m.bio && (
        <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4 whitespace-pre-line">
          {m.bio}
        </p>
      )}
      <div className="space-y-1.5 text-xs font-body mb-3">
        {m.phone && (
          <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-foreground/70 hover:text-highlight transition-colors" dir="ltr">
            <Phone className="w-3.5 h-3.5 text-highlight" /> {m.phone}
          </a>
        )}
        {m.email && (
          <a href={`mailto:${m.email}`} className="flex items-center gap-2 text-foreground/70 hover:text-highlight transition-colors break-all" dir="ltr">
            <Mail className="w-3.5 h-3.5 text-highlight" /> {m.email}
          </a>
        )}
      </div>
      <SocialButtons socials={m.socials} linkedin={m.linkedin_url} />
    </div>
  </article>
);

const Team = () => {
  const { t } = useTranslation();
  const { data: members, isLoading } = useTeam();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);


  const founder = members.find((m) => m.is_founder);
  const rest = members.filter((m) => !m.is_founder);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <header className="bg-primary text-primary-foreground pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-highlight-light hover:text-highlight transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("team.back", "Volver")}
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[2px] bg-highlight" />
            <span className="text-highlight text-sm tracking-[0.3em] uppercase font-body">
              {t("team.tagline", "Nuestro equipo")}
            </span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            {t("team.title", "Los profesionales detrás del despacho")}
          </h1>
          <p className="font-body text-base md:text-lg text-primary-foreground/70 max-w-3xl">
            {t("team.subtitle", "Un equipo comprometido con la excelencia, la cercanía y la defensa rigurosa de los intereses de cada cliente.")}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-16 space-y-16">
        {isLoading && (
          <p className="text-center text-muted-foreground">{t("team.loading", "Cargando equipo...")}</p>
        )}

        {!isLoading && members.length === 0 && (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">{t("team.empty", "Aún no se han añadido miembros del equipo.")}</p>
          </div>
        )}

        {founder && (
          <section>
            <FounderCard m={founder} t={t} />
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-[2px] bg-highlight" />
              <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                {t("team.membersTitle", "Nuestros profesionales")}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((m) => (
                <MemberCard key={m.id} m={m} />
              ))}
            </div>
          </section>
        )}

        <section className="text-center bg-primary rounded-xl p-10 md:p-14">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            {t("team.ctaTitle", "¿Necesita asesoramiento jurídico?")}
          </h2>
          <p className="text-primary-foreground/70 font-body mb-6 max-w-xl mx-auto">
            {t("team.ctaText", "Contacte con nuestro equipo y reciba atención personalizada.")}
          </p>
          <Link
            to="/"
            state={{ scrollTo: "contacto" }}
            className="inline-flex items-center gap-2 bg-highlight text-accent-foreground px-7 py-3 rounded font-semibold hover:opacity-90 transition-opacity"
          >
            {t("team.ctaButton", "Contactar")}
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Team;
