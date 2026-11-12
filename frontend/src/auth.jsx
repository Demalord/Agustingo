import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = todavía no sabemos
  const [perfil, setPerfil] = useState(null);

  const cargarPerfil = useCallback(async (s) => {
    if (!s) return setPerfil(null);
    const { data, error } = await supabase.from('usuarios').select('*').eq('id', s.user.id).maybeSingle();
    if (error) return console.error(error);
    if (!data) return supabase.auth.signOut({ scope: 'local' }); // la cuenta fue eliminada
    setPerfil(data);
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession(s);
      setTimeout(() => cargarPerfil(s)); // fuera del callback: llamar a supabase dentro puede bloquearse
    });
    // APK: el navegador del sistema vuelve con co.edu.uniagustiniana.agustingo://login?code=...
    const deepLink = Capacitor.isNativePlatform() && App.addListener('appUrlOpen', async ({ url }) => {
      const code = new URL(url).searchParams.get('code');
      if (!code) return;
      await Browser.close().catch(() => {});
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) alert(error.message);
    });

    return () => {
      data.subscription.unsubscribe();
      if (deepLink) deepLink.then(h => h.remove());
    };
  }, [cargarPerfil]);

  const valor = {
    session,
    perfil,
    cargando: session === undefined || (session && !perfil),
    refrescarPerfil: () => cargarPerfil(session),
  };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
