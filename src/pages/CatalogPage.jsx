import { useState } from "react";
import {
  Search, Filter, Star, BookOpen, ShoppingCart, Clock,
  Eye, X, Check, AlertCircle, ChevronDown, Grid3X3, List,
} from "lucide-react";
import { mockBooks } from "../data/mockData";

// ─── Géneros disponibles ─────────────────────────────────────────────────
const GENRES = ["Todos", "Ficción", "Realismo Mágico", "Distopía", "Fantasía", "Historia", "Novela", "Autoayuda", "Misterio"];
const SORT_OPTIONS = [
  { value: "title",  label: "Título A-Z" },
  { value: "rating", label: "Mejor valorados" },
  { value: "price",  label: "Precio: menor a mayor" },
  { value: "year",   label: "Más recientes" },
];

// ─── Stars component ─────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-600"}
        />
      ))}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────
function StatusBadge({ available, stock }) {
  if (available === 0) {
    return (
      <span className="flex items-center gap-1 text-xs bg-red-500/15 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full">
        <AlertCircle size={10} />
        No disponible
      </span>
    );
  }
  if (available <= 2) {
    return (
      <span className="flex items-center gap-1 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full">
        <Clock size={10} />
        Últimas {available} copias
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
      <Check size={10} />
      Disponible ({available})
    </span>
  );
}

// ─── Modal de detalle de libro ───────────────────────────────────────────
function BookDetailModal({ book, onClose }) {
  const [tab, setTab] = useState("info");
  if (!book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl glass-card animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-indigo-900 via-violet-900 to-purple-900">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: `url(${book.cover})`, backgroundSize:"cover", backgroundPosition:"center", filter:"blur(8px)" }} />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 -mt-10 relative">
          <div className="flex gap-4">
            {/* Cover */}
            <img
              src={book.cover}
              alt={book.title}
              onError={(e) => { e.target.src = `https://placehold.co/80x120/1e293b/6366f1?text=${encodeURIComponent(book.title.slice(0,2))}`; }}
              className="w-20 h-28 object-cover rounded-xl shadow-2xl border border-white/10 flex-shrink-0"
            />
            {/* Info */}
            <div className="flex-1 pt-8">
              <h2 className="text-xl font-bold text-white mb-0.5">{book.title}</h2>
              <p className="text-slate-400 text-sm mb-2">{book.author} · {book.year}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Stars rating={book.rating} />
                  <span className="text-sm text-amber-400 font-semibold">{book.rating}</span>
                  <span className="text-xs text-slate-500">({book.reviews.toLocaleString()})</span>
                </div>
                <StatusBadge available={book.available} stock={book.stock} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 bg-white/3 rounded-xl p-1">
            {["info","descripcion"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all
                  ${tab === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {t === "info" ? "Información" : "Descripción"}
              </button>
            ))}
          </div>

          {tab === "info" ? (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { label: "Género",   value: book.genre },
                { label: "Páginas",  value: book.pages },
                { label: "ISBN",     value: book.isbn },
                { label: "Stock total", value: book.stock },
              ].map((f) => (
                <div key={f.label} className="bg-white/4 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">{f.label}</p>
                  <p className="text-sm text-slate-200 font-medium">{f.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">{book.description}</p>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-3 mt-5">
            {book.canRent && book.available > 0 && (
              <button
                id={`rent-btn-${book.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                <Clock size={16} />
                Rentar · ${book.rentalPrice.toFixed(2)}/sem
              </button>
            )}
            {book.canBuy && (
              <button
                id={`buy-btn-${book.id}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                <ShoppingCart size={16} />
                Comprar · ${book.price.toFixed(2)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tarjeta de Libro (Grid) ─────────────────────────────────────────────
function BookCard({ book, onView }) {
  return (
    <div className="glass-card overflow-hidden flex flex-col hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group animate-fade-in-up">
      {/* Cover */}
      <div className="relative overflow-hidden h-48 bg-slate-800">
        <img
          src={book.cover}
          alt={book.title}
          onError={(e) => {
            e.target.src = `https://placehold.co/200x280/1e293b/6366f1?text=${encodeURIComponent(book.title.slice(0,2))}`;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Overlay hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

        {/* Genre badge */}
        <span className="absolute top-2 left-2 text-[10px] bg-black/50 backdrop-blur-sm text-slate-300 border border-white/10 px-2 py-0.5 rounded-full">
          {book.genre}
        </span>

        {/* Quick view button */}
        <button
          id={`quick-view-${book.id}`}
          onClick={() => onView(book)}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-full flex items-center gap-1.5 border border-white/20">
            <Eye size={13} />
            Ver Detalles
          </span>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-semibold text-slate-100 mb-0.5 line-clamp-2 leading-tight">
          {book.title}
        </h3>
        <p className="text-xs text-slate-400 mb-2 truncate">{book.author}</p>

        <div className="flex items-center gap-1.5 mb-3">
          <Stars rating={book.rating} />
          <span className="text-xs text-slate-400">{book.rating} ({book.reviews.toLocaleString()})</span>
        </div>

        <div className="mb-3">
          <StatusBadge available={book.available} stock={book.stock} />
        </div>

        {/* Prices */}
        <div className="flex items-center gap-3 mb-3 mt-auto">
          <div className="text-center">
            <p className="text-xs text-slate-500">Compra</p>
            <p className="text-sm font-bold text-indigo-300">${book.price.toFixed(2)}</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-xs text-slate-500">Renta/sem</p>
            <p className="text-sm font-bold text-emerald-400">${book.rentalPrice.toFixed(2)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id={`card-rent-${book.id}`}
            disabled={!book.canRent || book.available === 0}
            className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-semibold rounded-lg border border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Clock size={12} />
            Rentar
          </button>
          <button
            id={`card-buy-${book.id}`}
            disabled={!book.canBuy}
            className="flex items-center justify-center gap-1.5 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold rounded-lg border border-indigo-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={12} />
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de Libro (List view) ───────────────────────────────────────────
function BookRow({ book, onView }) {
  return (
    <div className="glass-card p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-all duration-200 group">
      <img
        src={book.cover}
        alt={book.title}
        onError={(e) => { e.target.src = `https://placehold.co/48x64/1e293b/6366f1?text=${encodeURIComponent(book.title.slice(0,2))}`; }}
        className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-100 truncate">{book.title}</h3>
        <p className="text-xs text-slate-400 truncate">{book.author} · {book.genre}</p>
        <div className="flex items-center gap-2 mt-1">
          <Stars rating={book.rating} />
          <StatusBadge available={book.available} stock={book.stock} />
        </div>
      </div>
      <div className="hidden md:flex items-center gap-6 text-center">
        <div>
          <p className="text-xs text-slate-500">Compra</p>
          <p className="text-sm font-bold text-indigo-300">${book.price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Renta</p>
          <p className="text-sm font-bold text-emerald-400">${book.rentalPrice.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onView(book)}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
        >
          <Eye size={16} />
        </button>
        <button
          disabled={!book.canRent || book.available === 0}
          className="py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white text-xs font-semibold rounded-lg border border-emerald-500/30 transition-all disabled:opacity-40"
        >
          Rentar
        </button>
        <button
          className="py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold rounded-lg border border-indigo-500/30 transition-all"
        >
          Comprar
        </button>
      </div>
    </div>
  );
}

// ─── CatalogPage Principal ────────────────────────────────────────────────
export default function CatalogPage() {
  const [search, setSearch]           = useState("");
  const [selectedGenre, setGenre]     = useState("Todos");
  const [sortBy, setSortBy]           = useState("rating");
  const [viewMode, setViewMode]       = useState("grid"); // "grid" | "list"
  const [showFilter, setShowFilter]   = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Filtrado y ordenamiento
  const filtered = mockBooks
    .filter((b) => {
      const matchSearch = b.title.toLowerCase().includes(search.toLowerCase())
        || b.author.toLowerCase().includes(search.toLowerCase());
      const matchGenre = selectedGenre === "Todos" || b.genre.includes(selectedGenre);
      return matchSearch && matchGenre;
    })
    .sort((a, b) => {
      if (sortBy === "title")  return a.title.localeCompare(b.title);
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price")  return a.price - b.price;
      if (sortBy === "year")   return b.year - a.year;
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Catálogo de Libros</h1>
        <p className="text-slate-400 text-sm">
          {filtered.length} libros disponibles · Explora y renta o compra tus favoritos
        </p>
      </div>

      {/* Search & Filters Bar */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="catalog-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o autor..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Genre selector */}
        <div className="relative">
          <select
            id="genre-filter"
            value={selectedGenre}
            onChange={(e) => setGenre(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            {GENRES.map((g) => <option key={g} value={g} className="bg-slate-800">{g}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-slate-800">{o.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {/* View toggle */}
        <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 gap-1">
          <button
            id="grid-view-btn"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode==="grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Grid3X3 size={15} />
          </button>
          <button
            id="list-view-btn"
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${viewMode==="list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Genre quick filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {GENRES.map((g) => (
          <button
            key={g}
            id={`genre-chip-${g}`}
            onClick={() => setGenre(g)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${selectedGenre === g
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                : "bg-white/5 text-slate-400 border border-white/8 hover:border-indigo-500/40 hover:text-indigo-400"
              }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Books Grid / List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen size={48} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No se encontraron libros</p>
          <p className="text-slate-500 text-sm">Intenta con otro término de búsqueda o género</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((book, i) => (
            <div key={book.id} style={{ animationDelay: `${i * 50}ms` }}>
              <BookCard book={book} onView={setSelectedBook} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((book) => (
            <BookRow key={book.id} book={book} onView={setSelectedBook} />
          ))}
        </div>
      )}

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </div>
  );
}
