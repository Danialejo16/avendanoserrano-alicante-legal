import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import {
  CookiePreferences,
  DEFAULT_PREFERENCES,
  getConsent,
  setConsent,
  onOpenCookieSettings,
} from "@/lib/cookies";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] =
    useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    setPreferences(existing);
  }, []);

  // Allow other components (e.g. footer link) to reopen the panel.
  useEffect(() => {
    return onOpenCookieSettings(() => {
      const existing = getConsent();
      if (existing) setPreferences(existing);
      setShowDetails(true);
      setVisible(true);
    });
  }, []);

  const saveAndClose = (prefs: CookiePreferences) => {
    setConsent(prefs);
    setPreferences(prefs);
    setVisible(false);
    setShowDetails(false);
  };

  const handleAcceptAll = () =>
    saveAndClose({ necessary: true, analytics: true, marketing: true });

  const handleRejectAll = () =>
    saveAndClose({ necessary: true, analytics: false, marketing: false });

  const handleSavePreferences = () => saveAndClose(preferences);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => {}}
      />
      <div className="relative z-10 w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-background border border-border rounded-xl shadow-2xl p-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            Política de Cookies
          </h3>
        </div>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Utilizamos cookies para mejorar su experiencia de navegación, analizar el tráfico del sitio
          y personalizar el contenido. Puede aceptar todas, rechazarlas o configurar sus preferencias.
        </p>

        {showDetails && (
          <div className="space-y-4 mb-5 p-4 rounded-lg bg-muted/50 border border-border animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Necesarias</p>
                <p className="text-xs text-muted-foreground">
                  Imprescindibles para el funcionamiento del sitio
                </p>
              </div>
              <Switch checked disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Analíticas</p>
                <p className="text-xs text-muted-foreground">
                  Nos ayudan a entender cómo usa el sitio
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(v) =>
                  setPreferences((p) => ({ ...p, analytics: v }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Marketing</p>
                <p className="text-xs text-muted-foreground">
                  Permiten mostrar contenido personalizado
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(v) =>
                  setPreferences((p) => ({ ...p, marketing: v }))
                }
              />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {showDetails ? (
            <Button
              onClick={handleSavePreferences}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Guardar preferencias
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleRejectAll}
                className="flex-1 border-border text-foreground hover:bg-muted"
              >
                Rechazar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDetails(true)}
                className="flex-1 border-border text-foreground hover:bg-muted"
              >
                Configurar
              </Button>
              <Button
                onClick={handleAcceptAll}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Aceptar todo
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Puede modificar sus preferencias en cualquier momento desde el enlace
          “Configurar cookies” en el pie de página.
        </p>
      </div>
    </div>
  );
};

export default CookieConsent;
