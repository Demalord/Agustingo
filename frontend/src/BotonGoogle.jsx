import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { REDIRECT_NATIVO, supabase } from './supabase';

// Google bloquea su login dentro de WebViews (disallowed_useragent): en el APK se abre en el
// navegador del sistema y vuelve por deep link (ver appUrlOpen en auth.jsx).
export default function BotonGoogle() {
  const [error, setError] = useState('');
  const nativo = Capacitor.isNativePlatform();

  async function entrar() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // origin + pathname: en GitHub Pages la app vive en /Agustingo/, no en la raíz
        redirectTo: nativo ? REDIRECT_NATIVO : window.location.origin + window.location.pathname,
        skipBrowserRedirect: nativo,
      },
    });
    if (error) return setError(error.message);
    if (nativo) await Browser.open({ url: data.url });
  }

  return (
    <>
      <div className="separador">o</div>
      <button type="button" className="btn btn-google" onClick={entrar}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/>
          <path fill="#FBBC05" d="M10.6 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.1z"/>
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/>
        </svg>
        Continuar con Google
      </button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
