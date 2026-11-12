// ─── Cliente de Supabase ──────────────────────────────────────────────────
// Las claves se leen del archivo .env (ver .env.example). En Vite las variables
// deben empezar con VITE_ y se leen con import.meta.env (no con process.env).
// Si no hay claves configuradas, el sistema funciona en modo local (localStorage).
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const key = rawKey && !rawKey.startsWith("pega-aqui") ? rawKey : null;

export const supabase = url && key ? createClient(url, key) : null;
export const isRemote = Boolean(supabase);
