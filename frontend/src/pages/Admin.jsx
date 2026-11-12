import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth';
import { CURSOS, TIPOS, rpc, supabase, supabaseSinSesion } from '../supabase';

const opcionesDe = obj => Object.entries(obj).map(([k, v]) => <option key={k} value={k}>{v}</option>);

export default function Admin() {
  const [tab, setTab] = useState('usuarios');
  const [stats, setStats] = useState(null);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');

  const cargarStats = useCallback(() => rpc('admin_stats').then(setStats, e => setError(e.message)), []);
  useEffect(() => {
    cargarStats();
    rpc('obtener_arbol').then(a => setSkills(a.skills), e => setError(e.message));
  }, [cargarStats]);

  return (
    <div className="caja admin">
      <h1>Administración</h1>
      {error && <p className="error">{error}</p>}
      {stats && <Stats stats={stats} skills={skills} />}
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'usuarios'} className={tab === 'usuarios' ? 'activa' : ''} onClick={() => setTab('usuarios')}>Usuarios</button>
        <button role="tab" aria-selected={tab === 'preguntas'} className={tab === 'preguntas' ? 'activa' : ''} onClick={() => setTab('preguntas')}>Preguntas</button>
      </div>
      {tab === 'usuarios'
        ? <Usuarios onCambio={cargarStats} />
        : <Preguntas skills={skills} onCambio={cargarStats} />}
    </div>
  );
}

function Stats({ stats, skills }) {
  const total = c => stats.preguntas.filter(p => p.curso === c).reduce((n, p) => n + p.total, 0);
  const nombre = id => skills.find(s => s.id === id)?.nombre ?? id;
  return (
    <>
      <div className="tarjetas">
        <div className="tarjeta"><b>{stats.usuarios}</b>usuarios</div>
        <div className="tarjeta"><b>{total('en')}</b>preguntas de inglés</div>
        <div className="tarjeta"><b>{total('it')}</b>preguntas de italiano</div>
        <div className="tarjeta"><b>{stats.dominadas}</b>skills dominadas</div>
      </div>
      <details className="detalle">
        <summary>Preguntas por curso y skill</summary>
        <div className="tabla-scroll">
          <table>
            <thead><tr><th>Curso</th><th>Skill</th><th>Preguntas</th></tr></thead>
            <tbody>{stats.preguntas.map(p => <tr key={p.curso + p.skill}><td>{CURSOS[p.curso]}</td><td>{nombre(p.skill)}</td><td>{p.total}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </>
  );
}

// ───────────── Usuarios ─────────────

function Usuarios({ onCambio }) {
  const { perfil } = useAuth();
  const [lista, setLista] = useState([]);
  const [msg, setMsg] = useState(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('usuarios').select('*').order('creado_en');
    error ? setMsg({ ok: false, texto: error.message }) : setLista(data);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  async function accion(fn, textoOk) {
    try {
      await fn();
      setMsg({ ok: true, texto: textoOk });
      cargar();
      onCambio();
    } catch (err) {
      setMsg({ ok: false, texto: err.message });
    }
  }

  return (
    <>
      <NuevoUsuario onCreado={texto => { setMsg({ ok: true, texto }); cargar(); onCambio(); }} />
      {msg && <p className={msg.ok ? 'ok' : 'error'} role="status">{msg.texto}</p>}
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Curso</th><th></th></tr></thead>
          <tbody>
            {lista.map(u => <FilaUsuario key={u.id} u={u} esYo={u.id === perfil.id} accion={accion} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FilaUsuario({ u, esYo, accion }) {
  const [f, setF] = useState(u);
  const set = k => e => setF({ ...f, [k]: e.target.value });
  return (
    <tr>
      <td><input aria-label="Nombre" value={f.nombre} onChange={set('nombre')} /></td>
      <td>{u.email}</td>
      <td>
        {/* no dejar que el admin se quite su propio rol por accidente */}
        <select aria-label="Rol" value={f.rol} onChange={set('rol')} disabled={esYo}>
          <option value="estudiante">estudiante</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td><select aria-label="Curso" value={f.curso_actual} onChange={set('curso_actual')}>{opcionesDe(CURSOS)}</select></td>
      <td className="acciones-fila">
        <button className="btn btn-chico" onClick={() => accion(
          () => rpc('admin_actualizar_usuario', { p_id: u.id, p_nombre: f.nombre, p_rol: f.rol, p_curso: f.curso_actual }),
          `${f.nombre} actualizado`)}>Guardar</button>
        {!esYo && (
          <button className="btn btn-chico btn-rojo" onClick={() => confirm(`¿Eliminar a ${u.email} y todo su progreso?`) && accion(
            () => rpc('admin_eliminar_usuario', { p_id: u.id }), `${u.email} eliminado`)}>Eliminar</button>
        )}
      </td>
    </tr>
  );
}

function NuevoUsuario({ onCreado }) {
  const vacio = { nombre: '', email: '', password: '', curso: 'en' };
  const [f, setF] = useState(vacio);
  const [error, setError] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });

  async function crear(e) {
    e.preventDefault();
    const { data, error } = await supabaseSinSesion.auth.signUp({
      email: f.email,
      password: f.password,
      options: { data: { nombre: f.nombre.trim(), curso: f.curso } },
    });
    if (error) return setError(error.message);
    setError('');
    setF(vacio);
    onCreado(data.session ? `Usuario ${f.email} creado` : `Usuario ${f.email} creado (debe confirmar su email)`);
  }

  return (
    <details className="detalle">
      <summary>+ Crear usuario</summary>
      <form className="formulario grid-form" onSubmit={crear}>
        <label>Nombre<input required pattern=".*\S.*" value={f.nombre} onChange={set('nombre')} /></label>
        <label>Email<input type="email" required value={f.email} onChange={set('email')} /></label>
        <label>Contraseña<input type="password" required minLength={6} autoComplete="new-password" value={f.password} onChange={set('password')} /></label>
        <label>Curso<select value={f.curso} onChange={set('curso')}>{opcionesDe(CURSOS)}</select></label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-chico">Crear</button>
      </form>
    </details>
  );
}

// ───────────── Preguntas ─────────────

function Preguntas({ skills, onCambio }) {
  const [filtro, setFiltro] = useState({ curso: '', skill: '', tipo: '' });
  const [lista, setLista] = useState([]);
  const [editando, setEditando] = useState(null); // null | {} (nueva) | fila
  const [msg, setMsg] = useState(null);
  const nombreSkill = id => skills.find(s => s.id === id)?.nombre ?? id;
  const setFiltroDe = k => e => setFiltro({ ...filtro, [k]: e.target.value });

  const cargar = useCallback(async () => {
    let q = supabase.from('preguntas').select('*').order('id');
    for (const [k, v] of Object.entries(filtro)) if (v) q = q.eq(k, v);
    const { data, error } = await q;
    error ? setMsg({ ok: false, texto: error.message }) : setLista(data);
  }, [filtro]);
  useEffect(() => { cargar(); }, [cargar]);

  async function eliminar(p) {
    if (!confirm(`¿Eliminar la pregunta #${p.id}?`)) return;
    const { error } = await supabase.from('preguntas').delete().eq('id', p.id);
    setMsg(error ? { ok: false, texto: error.message } : { ok: true, texto: `Pregunta #${p.id} eliminada` });
    if (!error) { cargar(); onCambio(); }
  }

  return (
    <>
      <div className="filtros">
        <select aria-label="Filtrar curso" value={filtro.curso} onChange={setFiltroDe('curso')}>
          <option value="">Todos los cursos</option>{opcionesDe(CURSOS)}
        </select>
        <select aria-label="Filtrar skill" value={filtro.skill} onChange={setFiltroDe('skill')}>
          <option value="">Todas las skills</option>
          {skills.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <select aria-label="Filtrar tipo" value={filtro.tipo} onChange={setFiltroDe('tipo')}>
          <option value="">Todos los tipos</option>{opcionesDe(TIPOS)}
        </select>
        <button className="btn btn-chico" onClick={() => setEditando({})}>+ Nueva pregunta</button>
      </div>

      {editando && (
        <FormPregunta key={editando.id ?? 'nueva'} p={editando} skills={skills} onCerrar={texto => {
          setEditando(null);
          if (texto) { setMsg({ ok: true, texto }); cargar(); onCambio(); }
        }} />
      )}
      {msg && <p className={msg.ok ? 'ok' : 'error'} role="status">{msg.texto}</p>}

      <div className="tabla-scroll">
        <table>
          <thead><tr><th>#</th><th>Curso</th><th>Skill</th><th>Tipo</th><th>Pregunta</th><th>Respuesta</th><th></th></tr></thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td><td>{p.curso}</td><td>{nombreSkill(p.skill)}</td><td>{TIPOS[p.tipo]}</td>
                <td>{p.pregunta}</td><td>{p.respuesta}</td>
                <td className="acciones-fila">
                  <button className="btn btn-chico btn-gris" onClick={() => setEditando(p)}>Editar</button>
                  <button className="btn btn-chico btn-rojo" onClick={() => eliminar(p)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ayuda">{lista.length} preguntas</p>
    </>
  );
}

function FormPregunta({ p, skills, onCerrar }) {
  const [f, setF] = useState({
    curso: p.curso ?? 'en',
    skill: p.skill ?? skills[0]?.id ?? '',
    tipo: p.tipo ?? 'opcion',
    pregunta: p.pregunta ?? '',
    respuesta: p.respuesta ?? '',
  });
  // opcion → filas [texto]; texto_real → filas [palabra, significado]
  const [filas, setFilas] = useState(() => (Array.isArray(p.opciones) ? p.opciones.map(o => [o]) : Object.entries(p.opciones ?? {})));
  const [error, setError] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  const cols = { opcion: 1, texto_real: 2 }[f.tipo] ?? 0;

  async function guardar(e) {
    e.preventDefault();
    const llenas = filas.filter(r => Array.from({ length: cols }, (_, j) => r[j]?.trim()).every(Boolean));
    const opciones = cols === 1 ? llenas.map(r => r[0].trim())
      : cols === 2 ? Object.fromEntries(llenas.map(([k, v]) => [k.trim().toLowerCase(), v.trim()]))
      : null;
    const respuesta = f.respuesta.trim();
    if (cols === 1 && opciones.length < 2) return setError('Agrega al menos 2 opciones');
    if (cols === 1 && !opciones.includes(respuesta)) return setError('La respuesta debe ser exactamente una de las opciones');

    const fila = { ...f, pregunta: f.pregunta.trim(), respuesta, opciones };
    const { error } = p.id
      ? await supabase.from('preguntas').update(fila).eq('id', p.id)
      : await supabase.from('preguntas').insert(fila);
    error ? setError(error.message) : onCerrar(p.id ? `Pregunta #${p.id} actualizada` : 'Pregunta creada');
  }

  const editarCelda = (i, j, valor) => setFilas(filas.map((r, k) => (k === i ? Object.assign([...r], { [j]: valor }) : r)));

  return (
    <form className="formulario panel" onSubmit={guardar}>
      <h2>{p.id ? `Editar pregunta #${p.id}` : 'Nueva pregunta'}</h2>
      <div className="grid-form">
        <label>Curso<select value={f.curso} onChange={set('curso')}>{opcionesDe(CURSOS)}</select></label>
        <label>Skill<select value={f.skill} onChange={set('skill')}>{skills.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label>
        <label>Tipo<select value={f.tipo} onChange={set('tipo')}>{opcionesDe(TIPOS)}</select></label>
      </div>
      <label>Pregunta / texto<textarea required value={f.pregunta} onChange={set('pregunta')} /></label>
      <label>Respuesta <span className="ayuda">(varias válidas separadas por "|"; la primera es la que se muestra)</span>
        <input required value={f.respuesta} onChange={set('respuesta')} />
      </label>

      {cols > 0 && (
        <fieldset className="editor-opciones">
          <legend>{cols === 1 ? 'Opciones' : 'Pistas (palabra → significado)'}</legend>
          {filas.map((r, i) => (
            <div className="fila-op" key={i}>
              {Array.from({ length: cols }, (_, j) => (
                <input key={j} value={r[j] ?? ''} onChange={e => editarCelda(i, j, e.target.value)}
                  placeholder={cols === 1 ? `Opción ${i + 1}` : j ? 'significado' : 'palabra'} />
              ))}
              <button type="button" className="btn-x" aria-label="Quitar fila" onClick={() => setFilas(filas.filter((_, k) => k !== i))}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-chico btn-gris" onClick={() => setFilas([...filas, []])}>+ Agregar</button>
        </fieldset>
      )}

      {error && <p className="error">{error}</p>}
      <div className="acciones">
        <button className="btn">Guardar</button>
        <button type="button" className="btn btn-gris" onClick={() => onCerrar(null)}>Cancelar</button>
      </div>
    </form>
  );
}
