-- ════════════════════════════════════════════════════════════════════════
-- Sistema Biblioteca – Esquema de base de datos (Supabase / PostgreSQL)
-- Cómo usarlo: Supabase › SQL Editor › New query › pegar todo › Run
-- Se puede ejecutar más de una vez: borra y vuelve a crear las tablas.
-- Los datos de prueba los carga la aplicación la primera vez que se abre.
-- ════════════════════════════════════════════════════════════════════════

drop table if exists audit, fines, sales, loans, books, users, settings cascade;

-- Usuarios (requerimientos 1.x y 6.1)
create table users (
  id        integer primary key,
  name      text    not null,
  email     text    not null unique,
  role      text    not null check (role in ('administrador','bibliotecario','usuario')),
  status    text    not null default 'activo' check (status in ('activo','suspendido')),
  password  text    not null,
  avatar    text,
  loans     integer not null default 0,
  fines     double precision not null default 0,
  joined    date    not null default current_date
);

-- Libros (requerimientos 2.x)
create table books (
  id            integer primary key,
  title         text not null,
  author        text not null,
  isbn          text not null unique,
  genre         text,
  cover         text,
  price         double precision not null,
  rental_price  double precision not null,
  stock         integer not null default 0 check (stock >= 0),
  available     integer not null default 0 check (available >= 0),
  rating        double precision default 0,
  reviews       integer default 0,
  status        text,
  year          integer,
  pages         integer,
  description   text,
  tags          text[] default '{}',
  can_rent      boolean default true,
  can_buy       boolean default true
);

-- Préstamos y rentas (requerimientos 3.x y 4.x)
create table loans (
  id           text primary key,
  user_id      integer references users(id),
  user_name    text,
  book_id      integer references books(id),
  book_title   text,
  book_author  text,
  loan_date    date not null,
  due_date     date not null,
  return_date  date,
  type         text not null default 'loan' check (type in ('loan','rent')),
  renewals     integer not null default 0,
  fine         double precision not null default 0,
  condition    text check (condition in ('good','damaged','lost'))
);

-- Ventas y rentas cobradas
create table sales (
  id          text primary key,
  user_id     integer references users(id),
  user_name   text,
  book_id     integer references books(id),
  book_title  text,
  type        text not null check (type in ('buy','rent')),
  amount      double precision not null,
  date        date not null,
  loan_id     text
);

-- Multas (requerimiento 4.3 / 4.4)
create table fines (
  id         text primary key,
  user_id    integer references users(id),
  user_name  text,
  loan_id    text,
  concept    text,
  amount     double precision not null,
  date       date not null,
  paid       boolean not null default false,
  paid_date  date
);

-- Bitácora de auditoría (requerimiento 6.4)
create table audit (
  id      text primary key,
  date    timestamptz not null default now(),
  actor   text,
  action  text not null,
  detail  text
);

-- Configuración global (requerimiento 6.2): una sola fila
create table settings (
  id    integer primary key default 1 check (id = 1),
  data  jsonb not null
);

-- ── Acceso desde la aplicación ───────────────────────────────────────────
-- Proyecto académico: la clave pública (anon) puede leer y escribir.
-- Para producción se deben restringir estas políticas.
do $$
declare t text;
begin
  foreach t in array array['users','books','loans','sales','fines','audit','settings'] loop
    execute format('grant select, insert, update, delete on table %I to anon, authenticated', t);
    execute format('alter table %I enable row level security', t);
    execute format('create policy "acceso_app_%s" on %I for all to anon, authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ── Tiempo real: avisar a todos los navegadores cuando cambian los datos ──
alter publication supabase_realtime add table users, books, loans, sales, fines, audit, settings;
