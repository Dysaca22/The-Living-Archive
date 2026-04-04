import { Link, useParams } from 'react-router-dom';

const CATEGORY_TO_QUERY: Record<string, string> = {
  terror: 'Peliculas de terror inmersivo',
  romance: 'Peliculas romanticas memorables',
  drama: 'Dramas intensos contemporaneos',
  policiaco: 'Thrillers policiacos recomendados',
  documental: 'Documentales imprescindibles',
  indigena: 'Cine indigena y narrativas originarias',
  animadas: 'Peliculas animadas recomendadas',
};

function prettifySlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function CategoryPage() {
  const { slug = '' } = useParams();
  const query = CATEGORY_TO_QUERY[slug] ?? `Peliculas de categoria ${slug}`;

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-5xl md:text-6xl font-serif italic mb-4">{prettifySlug(slug || 'Categoria')}</h1>
        <p className="text-on-surface-variant max-w-2xl">
          Ruta inmersiva inicial. En el siguiente lote se completa con layouts y curaduría visual dedicada.
        </p>
      </header>

      <section className="glass rounded-3xl p-10 border border-white/5">
        <h2 className="text-2xl font-serif italic mb-4">Discovery preparado</h2>
        <p className="text-on-surface-variant mb-8">
          Esta ruta ya está conectada al flujo de búsqueda y lista para evolucionar sin tocar el shell.
        </p>
        <Link
          to={`/buscar?q=${encodeURIComponent(query)}`}
          className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-colors px-6 py-3 font-mono text-xs uppercase tracking-widest text-primary"
        >
          Explorar categoría
        </Link>
      </section>
    </div>
  );
}
