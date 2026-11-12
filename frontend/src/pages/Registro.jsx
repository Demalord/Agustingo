import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CURSOS, supabase } from '../supabase';
import BotonGoogle from '../BotonGoogle';

export default function Registro() {
  const [f, setF] = useState({ nombre: '', email: '', password: '', curso: 'en' });
  const [msg, setMsg] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function registrar(e) {
    e.preventDefault();
    setEnviando(true);
    // nombre y curso viajan en la metadata; el trigger crear_perfil los copia a public.usuarios
    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: { data: { nombre: f.nombre.trim(), curso: f.curso } },
    });
    setEnviando(false);
    if (error) return setMsg({ ok: false, texto: error.message });
    if (!data.session) setMsg({ ok: true, texto: 'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.' });
  }

  return (
    <div className="caja caja-angosta">
      <h1>Crear cuenta</h1>
      <form className="formulario" onSubmit={registrar}>
        <label>Nombre<input required pattern=".*\S.*" autoComplete="name" value={f.nombre} onChange={set('nombre')} /></label>
        <label>Email<input type="email" required autoComplete="email" value={f.email} onChange={set('email')} /></label>
        <label>Contraseña<input type="password" required minLength={6} autoComplete="new-password" value={f.password} onChange={set('password')} /></label>
        <label>Quiero aprender
          <select value={f.curso} onChange={set('curso')}>
            {Object.entries(CURSOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        {msg && <p className={msg.ok ? 'ok' : 'error'}>{msg.texto}</p>}
        <button className="btn" disabled={enviando}>{enviando ? 'Creando…' : 'Crear cuenta'}</button>
      </form>
      <BotonGoogle />
      <p className="pie-form">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  );
}
