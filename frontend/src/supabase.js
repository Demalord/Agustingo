import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en frontend/.env');

// pkce: el login con Google vuelve con ?code= en vez de #access_token=, que chocaría con el HashRouter
export const supabase = createClient(url, key, { auth: { flowType: 'pkce' } });

// deep link del APK para volver del navegador tras el login con Google (registrado en AndroidManifest.xml)
export const REDIRECT_NATIVO = 'co.edu.uniagustiniana.agustingo://login';

// Segundo cliente sin sesión guardada: el admin crea usuarios con signUp sin perder su propia sesión
export const supabaseSinSesion = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, storageKey: 'agustingo-signup' },
});

export const CURSOS = { en: 'Inglés', it: 'Italiano' };

export const TIPOS = {
  opcion: 'Opción múltiple',
  traducir_es_a_idioma: 'Traducir ES → idioma',
  traducir_idioma_a_es: 'Traducir idioma → ES',
  texto_real: 'Texto real',
};

export async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data;
}
