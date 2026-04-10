const Footer = () => {
  return (
    <footer className="bg-navy-deep border-t border-gold/10 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="font-heading text-lg font-semibold tracking-wide" style={{ color: "hsl(40, 33%, 97%)" }}>
            Avendaño Serrano
          </span>
          <span className="text-gold text-xs tracking-[0.3em] uppercase ml-2">Abogados</span>
        </div>
        <p className="font-body text-sm" style={{ color: "hsl(40, 15%, 55%)" }}>
          © {new Date().getFullYear()} Avendaño Serrano Abogados. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
