import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { CURSOS, rpc } from '../supabase';
import Barra from '../Barra';

export default function Leccion() {
  const { id } = useParams();
  const { perfil } = useAuth();
  const [lec, setLec] = useState(null);       // { corazones, preguntas[] } sin respuestas
  const [idx, setIdx] = useState(0);
  const [corazones, setCorazones] = useState(0);
  const [respuesta, setRespuesta] = useState('');
  const [res, setRes] = useState(null);       // lo que devuelve responder()
  const [fin, setFin] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const iniciar = useCallback(() => {
    setLec(null); setIdx(0); setRes(null); setRespuesta(''); setFin(false); setError('');
    rpc('iniciar_leccion', { p_skill: id }).then(d => { setLec(d); setCorazones(d.corazones); }, e => setError(e.message));
  }, [id]);
  useEffect(iniciar, [iniciar]);

  const p = lec?.preguntas[idx];
  // shortcut: sort aleatorio con sesgo leve, suficiente para 3-4 opciones
  const opciones = useMemo(() => (p?.tipo === 'opcion' ? [...p.opciones].sort(() => Math.random() - 0.5) : []), [p]);

  async function comprobar(e) {
    e.preventDefault();
    if (!respuesta.trim() || res || enviando) return;
    setEnviando(true);
    try {
      const r = await rpc('responder', { p_skill: id, p_respuesta: respuesta });
      setRes(r);
      setCorazones(r.corazones);
    } catch (err) {
      setError(err.message);
    }
    setEnviando(false);
  }

  function continuar() {
    if (res.terminada) return setFin(true);
    setIdx(idx + 1);
    setRes(null);
    setRespuesta('');
  }

  if (error) return <div className="caja centro"><p className="error">{error}</p><Link to={`/skill/${id}`}>← Volver</Link></div>;
  if (!lec) return <p className="cargando">Preparando lección…</p>;

  if (fin) return (
    <div className="caja centro">
      {res.aprobada ? (
        <>
          <h1>¡Lección completada!</h1>
          <p>Ahora tienes <b>{res.puntos}</b> puntos en esta skill.{res.dominada && ' ¡Skill dominada!'}</p>
        </>
      ) : (
        <>
          <h1>Te quedaste sin corazones</h1>
          <p>Esta lección no cuenta. ¡Inténtalo otra vez!</p>
        </>
      )}
      <div className="acciones">
        <button className="btn" onClick={iniciar}>{res.aprobada ? 'Practicar otra vez' : 'Repetir lección'}</button>
        <Link className="btn btn-gris" to="/">Volver al árbol</Link>
      </div>
    </div>
  );

  const enunciado = {
    opcion: 'Elige la traducción correcta',
    traducir_es_a_idioma: `Traduce al ${CURSOS[perfil.curso_actual].toLowerCase()}`,
    traducir_idioma_a_es: 'Traduce al español',
  }[p.tipo];

  return (
    <div className="caja leccion">
      <div className="leccion-top">
        <Link to={`/skill/${id}`} className="salir" aria-label="Salir de la lección">✕</Link>
        <Barra valor={idx + (res ? 1 : 0)} max={lec.preguntas.length} />
        <div className="corazones" aria-label={`${corazones} corazones`}>
          {Array.from({ length: lec.corazones }, (_, i) => (
            <span key={i} className={i < corazones ? 'corazon' : 'corazon vacio'}>♥</span>
          ))}
        </div>
      </div>

      <form onSubmit={comprobar}>
        <p className="enunciado">{enunciado}</p>
        <h2 className="pregunta">{p.pregunta}</h2>

        {p.tipo === 'opcion' ? (
          <div className="opciones">
            {opciones.map(o => (
              <button type="button" key={o} disabled={!!res}
                className={'opcion' + (respuesta === o ? ' elegida' : '')}
                onClick={() => setRespuesta(o)}>{o}</button>
            ))}
          </div>
        ) : (
          <textarea key={idx} autoFocus value={respuesta} disabled={!!res}
            placeholder="Escribe tu traducción"
            onChange={e => setRespuesta(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && comprobar(e)} />
        )}

        {res ? (
          <div className={'feedback ' + (res.correcto ? 'bien' : 'mal')}>
            <div>
              <strong>{res.correcto ? '¡Correcto!' : 'Incorrecto'}</strong>
              {!res.correcto && <p>Respuesta correcta: <b>{res.respuesta_correcta}</b></p>}
            </div>
            <button type="button" className="btn" autoFocus onClick={continuar}>Continuar</button>
          </div>
        ) : (
          <div className="acciones-derecha">
            <button className="btn" disabled={!respuesta.trim() || enviando}>Comprobar</button>
          </div>
        )}
      </form>
    </div>
  );
}
