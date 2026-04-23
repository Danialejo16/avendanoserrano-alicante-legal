import { Link } from "react-router-dom";
import { ArrowLeft, GraduationCap, Briefcase, Award, MapPin, Mail, Phone, Scale, BookOpen, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";

const Curriculum = () => {
  const { t } = useTranslation();

  const education = [
    {
      title: t("cv.education.law.title", { defaultValue: "Grado en Derecho" }),
      institution: "Universidad de Alicante",
      period: "2016 – 2020",
      description: t("cv.education.law.desc", { defaultValue: "Formación integral en las distintas ramas del ordenamiento jurídico español y europeo." }),
    },
    {
      title: t("cv.education.master.title", { defaultValue: "Máster en Abogacía" }),
      institution: "Universidad de Alicante",
      period: "2020 – 2021",
      description: t("cv.education.master.desc", { defaultValue: "Habilitación profesional para el ejercicio de la abogacía. Prácticas en despacho." }),
    },
  ];

  const experience = [
    {
      title: t("cv.experience.founder.title", { defaultValue: "Fundador — Avendaño Serrano Abogados" }),
      period: t("cv.experience.founder.period", { defaultValue: "2023 – Presente" }),
      description: t("cv.experience.founder.desc", { defaultValue: "Dirección y gestión integral del despacho. Asesoramiento jurídico en derecho civil, laboral, extranjería, penal y mercantil." }),
    },
    {
      title: t("cv.experience.collaborator.title", { defaultValue: "Abogado colaborador" }),
      period: "2021 – 2023",
      description: t("cv.experience.collaborator.desc", { defaultValue: "Ejercicio profesional en diversas áreas del derecho, con especial dedicación al derecho de extranjería y derecho civil." }),
    },
  ];

  const skills = [
    t("services.items.extranjeria.title"),
    t("services.items.civil.title"),
    t("services.items.laboral.title"),
    t("services.items.penal.title"),
    t("services.items.familia.title"),
    t("services.items.mercantil.title"),
    t("services.items.administrativo.title"),
  ];

  const languages = [
    { name: t("cv.lang.spanish", { defaultValue: "Español" }), level: t("cv.lang.native", { defaultValue: "Nativo" }) },
    { name: t("cv.lang.valencian", { defaultValue: "Valenciano" }), level: t("cv.lang.advanced", { defaultValue: "Avanzado" }) },
    { name: t("cv.lang.english", { defaultValue: "Inglés" }), level: t("cv.lang.upperInt", { defaultValue: "Intermedio alto" }) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-highlight-light hover:text-highlight transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("curriculum.back")}
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="w-28 h-28 rounded-full bg-navy-deep border-2 border-highlight/30 flex items-center justify-center shrink-0">
              <Scale className="w-12 h-12 text-highlight-light" />
            </div>
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
                {t("curriculum.name")}
              </h1>
              <p className="text-lg text-primary-foreground/70 font-body mb-4">
                {t("curriculum.role")}
              </p>
              <div className="flex flex-wrap gap-4 text-sm font-body text-primary-foreground/60">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-highlight" /> {t("curriculum.location")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-highlight" /> @icali.es
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-highlight" /> +34 645 04 16 64
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-12 py-16 space-y-16">
        <section>
          <SectionTitle icon={BookOpen} title={t("curriculum.profile")} />
          <p className="font-body text-base leading-relaxed text-muted-foreground max-w-3xl">
            {t("curriculum.profileText")}
          </p>
        </section>

        <section>
          <SectionTitle icon={Briefcase} title={t("curriculum.experience")} />
          <div className="space-y-8">
            {experience.map((item) => (
              <TimelineItem key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={GraduationCap} title={t("curriculum.education")} />
          <div className="space-y-8">
            {education.map((item) => (
              <TimelineItem key={item.title} {...item} institution={item.institution} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={Award} title={t("curriculum.skills")} />
          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-4 py-2 rounded-full bg-secondary text-foreground text-sm font-body border border-border hover:border-highlight/40 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={Languages} title={t("curriculum.languages")} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {languages.map((lang) => (
              <div
                key={lang.name}
                className="bg-card border border-border rounded-lg p-5 text-center"
              >
                <p className="font-heading text-lg font-semibold text-foreground">{lang.name}</p>
                <p className="text-sm text-muted-foreground font-body mt-1">{lang.level}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center bg-primary rounded-xl p-10 md:p-14">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            {t("curriculum.ctaTitle")}
          </h2>
          <p className="text-primary-foreground/70 font-body mb-6 max-w-xl mx-auto">
            {t("curriculum.ctaText")}
          </p>
          <Link
            to="/"
            state={{ scrollTo: "contacto" }}
            className="inline-flex items-center gap-2 bg-highlight text-accent-foreground px-7 py-3 rounded font-semibold hover:opacity-90 transition-opacity"
          >
            {t("curriculum.ctaButton")}
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 rounded-lg bg-navy-deep flex items-center justify-center">
      <Icon className="w-5 h-5 text-highlight-light" />
    </div>
    <h2 className="font-heading text-2xl font-bold text-foreground">{title}</h2>
  </div>
);

const TimelineItem = ({
  title,
  period,
  description,
  institution,
}: {
  title: string;
  period: string;
  description: string;
  institution?: string;
}) => (
  <div className="relative pl-6 border-l-2 border-highlight/30">
    <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-highlight" />
    <p className="text-sm text-highlight font-body font-semibold mb-1">{period}</p>
    <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
    {institution && (
      <p className="text-sm text-muted-foreground font-body">{institution}</p>
    )}
    <p className="text-muted-foreground font-body text-sm mt-2 leading-relaxed">{description}</p>
  </div>
);

export default Curriculum;
