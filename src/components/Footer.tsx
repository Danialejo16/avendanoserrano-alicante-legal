import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-navy-deep border-t border-gold/10 py-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <img src={logo} alt="Avendaño Serrano Abogados" className="h-10 w-auto" />
        <p className="font-body text-sm" style={{ color: "hsl(40, 15%, 55%)" }}>
          © {new Date().getFullYear()} Avendaño Serrano Abogados. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
