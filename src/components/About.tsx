import { Award, Clock, TrendingUp, Heart } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

const valueKeys = [
  { key: "commitment", icon: Heart },
  { key: "availability", icon: Clock },
  { key: "prices", icon: TrendingUp },
  { key: "results", icon: Award },
];

const About = () => {
  const { t } = useTranslation();
  return (
    <section id="nosotros" className="section-padding bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[2px] bg-highlight" />
              <span className="text-highlight text-sm tracking-[0.3em] uppercase font-body">{t("about.tagline")}</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              {t("about.title")}
            </h2>
            <div className="space-y-4 font-body text-base leading-relaxed text-primary-foreground/75">
              <p>
                <strong className="text-highlight-light">{t("about.p1Brand")}</strong>{" "}
                {t("about.p1Rest")}
              </p>
              <p>{t("about.p2")}</p>
              <p>{t("about.p3")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {valueKeys.map((v) => (
              <div key={v.key} className="bg-primary-foreground/10 border border-highlight/15 rounded-lg p-6">
                <v.icon className="w-8 h-8 text-highlight mb-4" />
                <h3 className="font-heading text-lg font-semibold text-primary-foreground mb-2">
                  {t(`about.values.${v.key}.title`)}
                </h3>
                <p className="font-body text-sm text-primary-foreground/60">
                  {t(`about.values.${v.key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
