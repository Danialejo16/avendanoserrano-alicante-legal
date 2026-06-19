## Gestor de Contenido Dinámico — Plan

Añadir un panel de administración para editar contenido del sitio (barra superior, contacto, currículum) con persistencia en base de datos y actualización inmediata en la web pública.

### 1. Base de datos (Lovable Cloud)

Crear una tabla `site_content` simple de tipo key/value JSON (1 fila por sección) — flexible y fácil de extender:

```
site_content
  - section  text (PK)     -- 'general' | 'contact' | 'cv'
  - data     jsonb         -- contenido de la sección
  - updated_at timestamptz
```

- Lectura pública (anon + authenticated): `SELECT`.
- Escritura solo para admins vía `has_role(auth.uid(), 'admin')`.
- Storage: usar el bucket existente `blog-media` (carpeta `cv/`) para la foto de perfil del CV.

Seed inicial con los valores actuales del sitio (teléfono, email, redes, dirección, horarios, mapa, datos CV, educación).

### 2. Hook compartido

`src/hooks/use-site-content.ts` — `useSiteContent(section)` que cachea con React Query y se suscribe a cambios `realtime` para refrescar la web pública al instante tras guardar.

### 3. Panel admin

Nueva ruta `/admin/content` (protegida por el mismo flujo que `/admin`), enlace en el header de `Admin.tsx`. Layout con **Tabs**:

- **General y Barra Superior**: teléfono, email, lista dinámica de redes (icono + URL).
- **Contacto**: dirección, embed de Google Maps (URL del iframe), horarios (lista días/horas), teléfonos y emails secundarios.
- **Currículum**: 
  - Subida de foto (Storage `blog-media/cv/`), preview.
  - Nombre, título, LinkedIn / enlaces profesionales, teléfono, email.
  - Lista dinámica de formación académica (título, institución, año inicio, año fin, descripción) con añadir / editar / eliminar.
  - Textarea "Sobre mí".

Cada pestaña con su botón Guardar, estado de carga, toasts de éxito/error.

### 4. Frontend público

Consumir `useSiteContent` en:

- `TopContactBar.tsx` → teléfono / email dinámicos.
- `Footer.tsx` → redes sociales dinámicas.
- `Contact.tsx` → dirección, teléfono, email, horarios, mapa, contactos secundarios.
- `Curriculum.tsx` → foto, datos personales, educación dinámica, extracto "Sobre mí".

Fallback a los valores actuales mientras carga / si no hay datos.

### Detalles técnicos

- Tabla con políticas RLS + GRANTs explícitos (`SELECT` para `anon`+`authenticated`, `INSERT/UPDATE` solo admin).
- Validaciones zod en el formulario admin (longitudes, URL, email).
- Realtime via `supabase.channel` sobre `site_content` para refrescar React Query al cambiar.
- Tailwind + componentes shadcn existentes (Tabs, Card, Input, Textarea, Button) → coherencia visual.
- Responsive: tabs apilados en móvil, formulario en columna única <md.

### Archivos

Nuevos: `src/pages/AdminContent.tsx`, `src/hooks/use-site-content.ts`, migración SQL.
Editados: `src/App.tsx` (ruta), `src/pages/Admin.tsx` (botón), `TopContactBar.tsx`, `Footer.tsx`, `Contact.tsx`, `Curriculum.tsx`.

### Lo que NO incluye

- No multi-idioma del contenido editable (se guarda un único valor por campo). Si lo quieres por idioma, lo añadimos en una segunda iteración.
- No historial/versionado de cambios.
