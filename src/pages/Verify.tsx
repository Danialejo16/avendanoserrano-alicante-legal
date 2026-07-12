import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, ShieldAlert, FileText, Download, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface VerifiedDoc {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  signed_url: string;
}

const Verify = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCode = (params.get("code") ?? "").trim();
  const [code, setCode] = useState(initialCode);
  const [doc, setDoc] = useState<VerifiedDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoTried, setAutoTried] = useState(false);

  const verify = async (raw: string) => {
    const c = raw.trim();
    if (!/^[A-Za-z0-9-]{6,40}$/.test(c)) {
      setError("Código no válido o documento expirado.");
      setDoc(null);
      return;
    }
    setLoading(true);
    setError(null);
    setDoc(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("verify-document", {
        body: { code: c },
      });
      if (fnErr || !data?.ok) {
        setError("Código no válido o documento expirado.");
      } else {
        setDoc(data.document as VerifiedDoc);
      }
    } catch {
      setError("No se ha podido verificar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode && !autoTried) {
      setAutoTried(true);
      verify(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams({ code });
    verify(code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-6 text-slate-300 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" /> Inicio
        </Button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 mb-4">
            <ShieldCheck className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight">
            Verificación de documentos
          </h1>
          <p className="mt-3 text-slate-400 text-sm md:text-base">
            Introduce el código de verificación para comprobar la autenticidad del documento
            emitido por el despacho.
          </p>
        </div>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-200">
                  Código de verificación
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="LAW-XXXX-XXX"
                  maxLength={40}
                  className="bg-slate-950/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
                  autoComplete="off"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !code}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8">
          {loading && (
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-2/3 bg-slate-800" />
                <Skeleton className="h-4 w-full bg-slate-800" />
                <Skeleton className="h-4 w-5/6 bg-slate-800" />
                <Skeleton className="h-10 w-40 bg-slate-800" />
              </CardContent>
            </Card>
          )}

          {!loading && error && (
            <Card className="bg-red-950/40 border-red-900/60">
              <CardContent className="p-6 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <p className="font-medium text-red-200">Verificación fallida</p>
                  <p className="text-sm text-red-300/80">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && doc && (
            <Card className="bg-slate-900/60 border-amber-500/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-emerald-400">
                      Documento auténtico
                    </p>
                    <h2 className="text-xl font-serif font-semibold">{doc.title}</h2>
                  </div>
                </div>

                {doc.description && (
                  <p className="text-slate-300 text-sm leading-relaxed">{doc.description}</p>
                )}

                <dl className="grid grid-cols-2 gap-3 text-sm border-t border-slate-800 pt-4">
                  <div>
                    <dt className="text-slate-500 text-xs uppercase">Fecha de emisión</dt>
                    <dd className="text-slate-200">
                      {new Date(doc.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 text-xs uppercase">Estado</dt>
                    <dd className="text-emerald-400 font-medium">Válido</dd>
                  </div>
                </dl>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    asChild
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                  >
                    <a href={doc.signed_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4" /> Ver documento
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                  >
                    <a href={doc.signed_url} download>
                      <Download className="h-4 w-4" /> Descargar
                    </a>
                  </Button>
                </div>

                <p className="text-xs text-slate-500 pt-2">
                  El enlace de acceso caduca automáticamente por seguridad.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verify;
