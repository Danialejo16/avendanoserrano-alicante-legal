import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "navbar" | "topbar";
}

const LanguageSwitcher = ({ variant = "navbar" }: Props) => {
  const { i18n, t } = useTranslation();
  const current =
    LANGUAGES.find((l) => l.code === i18n.language) ??
    LANGUAGES.find((l) => i18n.language?.startsWith(l.code)) ??
    LANGUAGES[0];

  const isTopbar = variant === "topbar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("language.select")}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors focus:outline-none",
          isTopbar
            ? "text-xs md:text-sm hover:text-highlight-light"
            : "text-sm text-foreground/70 hover:text-highlight tracking-wide"
        )}
      >
        <Globe className={cn(isTopbar ? "w-3.5 h-3.5" : "w-4 h-4")} />
        <span className="text-base leading-none">{current.flag}</span>
        <span className="font-body">{current.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] z-[70]">
        {LANGUAGES.map((lang) => {
          const active = lang.code === current.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              {active && <Check className="w-3.5 h-3.5 text-highlight" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
