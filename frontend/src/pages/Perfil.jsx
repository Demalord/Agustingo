import { useState } from 'react';
import { useAuth } from '../auth';
import { CURSOS, rpc, supabase } from '../supabase';

export default function Perfil() {
  const { perfil, refrescarPerfil } = useAuth();
  const [nombre, setNombre] = useState(perfil.nombre);
  const [email, setEmail] = useState(perfil.email);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);

  // envuelve un submit: ejecuta fn() y muestra el resultado
  const al = (fn, textoOk) => async e => {
    e.preventDefault();
    const { error } = await fn();
    setMsg(error ? { ok: false, texto: error.message } : { ok: true, texto: textoOk });
    if (!error) refrescarPerfil();
  };

  async function eliminar() {
    if (!confirm('¿Seguro? Se borrará tu cuenta y todo tu progreso. No se puede deshacer.')) return;
    try {
      await rpc('eliminar_mi_cuenta');
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      setMsg({ ok: false, texto: err.message });
    }
  }

  return (
    <div className="caja perfil">
      <h1>Mi perfil</h1>
      <dl className="datos">
        <dt>Nombre</dt><dd>{perfil.nombre}</dd>
        <dt>Email</dt><dd>{perfil.email}</dd>
        <dt>Curso</dt><dd>{CURSOS[perfil.curso_actual]}</dd>
        <dt>Rol</dt><dd>{perfil.rol}</dd>
        <dt>Miembro desde</dt><dd>{new Date(perfil.creado_en).toLocaleDateString('es')}</dd>
      </dl>

      {msg && <p className={msg.ok ? 'ok' : 'error'} role="status">{msg.texto}</p>}

      <form className="formulario fila-form" onSubmit={al(() => supabase.from('usuarios').update({ nombre: nombre.trim() }).eq('id', perfil.id), 'Nombre actualizado')}>
        <label>Nombre<input required pattern=".*\S.*" value={nombre} onChange={e => setNombre(e.target.value)} /></label>
        <button className="btn btn-chico">Guardar</button>
      </form>

      <form className="formulario fila-form" onSubmit={al(() => supabase.auth.updateUser({ email }), 'Email actualizado. Si la confirmación está activa, revisa tu correo.')}>
        <label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
        <button className="btn btn-chico">Cambiar email</button>
      </form>

      <form className="formulario fila-form" onSubmit={al(() => supabase.auth.updateUser({ password }), 'Contraseña cambiada')}>
        <label>Nueva contraseña<input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <button className="btn btn-chico">Cambiar contraseña</button>
      </form>

      <section className="peligro">
        <h2>Eliminar cuenta</h2>
        <p className="ayuda">Se borran tu cuenta y todo tu progreso en ambos cursos.</p>
        <button className="btn btn-rojo" onClick={eliminar}>Eliminar mi cuenta</button>
      </section>
    </div>
  );
}
