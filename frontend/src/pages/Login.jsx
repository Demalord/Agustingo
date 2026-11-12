import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import BotonGoogle from '../BotonGoogle';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setEnviando(false);
    if (error) setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message);
    // si sale bien, onAuthStateChange actualiza la sesión y SoloInvitado redirige al árbol
  }

  return (
    <div className="caja caja-angosta">
      <h1>Iniciar sesión</h1>
      <p className="ayuda">Aprende inglés o italiano gratis, una skill a la vez.</p>
      <form className="formulario" onSubmit={entrar}>
        <label>Email<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label>Contraseña<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <BotonGoogle />
      <p className="pie-form">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
    </div>
  );
}
