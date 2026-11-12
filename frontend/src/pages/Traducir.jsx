import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { rpc } from '../supabase';

// misma forma que las claves de las pistas: minúsculas, sin puntuación, conservando tildes y apóstrofos
const limpiar = w => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

export default function Traducir() {
  const { id } = useParams();
  const [textos, setTextos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { rpc('obtener_textos', { p_skill: id }).then(setTextos, e => setError(e.message)); }, [id]);

  if (error) return <div className="caja"><p className="error">{error}</p><Link to={`/skill/${id}`}>← Volver</Link></div>;
  if (!textos) return <p className="cargando">Cargando…</p>;

  return (
    <div className="caja">
      <Link to={`/skill/${id}`} className="volver">← Volver a la skill</Link>
      <h1>Traducir textos reales</h1>
      <p className="ayuda">Pasa el mouse o toca una palabra subrayada para ver qué significa.</p>
      {textos.length === 0 && <p>Esta skill todavía no tiene textos.</p>}
      {textos.map(t => <Texto key={t.id} t={t} />)}
    </div>
  );
}

function Texto({ t }) {
  const [traduccion, setTraduccion] = useState('');
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const pistas = t.opciones ?? {};

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      setRes(await rpc('traducir_texto', { p_id: t.id, p_traduccion: traduccion }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
    setEnviando(false);
  }

  return (
    <form className="texto-real" onSubmit={enviar}>
      <p className="texto">
        {t.pregunta.split(' ').map((w, i) => {
          const pista = pistas[limpiar(w)];
          return (
            <Fragment key={i}>
              {pista ? <span className="palabra" tabIndex={0} data-pista={pista}>{w}</span> : w}{' '}
            </Fragment>
          );
        })}
      </p>
      <textarea value={traduccion} onChange={e => setTraduccion(e.target.value)} placeholder="Tu traducción al español" />
      {error && <p className="error">{error}</p>}
      <div className="acciones-derecha">
        <button className="btn" disabled={!traduccion.trim() || enviando}>Enviar traducción</button>
      </div>
      {res && (
        <div className={'feedback columna ' + (res.aceptada ? 'bien' : 'mal')}>
          <strong>{res.porcentaje}% de similitud · {res.aceptada ? '¡Aceptada! Ganaste puntos' : 'Todavía no alcanza, intenta de nuevo'}</strong>
          <p>Traducción de referencia: <b>{res.referencia}</b></p>
          <p className="ayuda">Puntos en esta skill: {res.puntos}</p>
        </div>
      )}
    </form>
  );
}
