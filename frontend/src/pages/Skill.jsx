import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { rpc } from '../supabase';
import Barra from '../Barra';
import { iniciales } from './Arbol';

export default function Skill() {
  const { id } = useParams();
  const [arbol, setArbol] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { rpc('obtener_arbol').then(setArbol, e => setError(e.message)); }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!arbol) return <p className="cargando">Cargando…</p>;
  const s = arbol.skills.find(x => x.id === id);
  if (!s) return <div className="caja"><p>Esa skill no existe.</p><Link to="/">← Volver al árbol</Link></div>;

  return (
    <div className="caja centro">
      <Link to="/" className="volver">← Árbol</Link>
      <div className={`skill grande ${s.estado}`}><span className="circulo">{iniciales(s.nombre)}</span></div>
      <h1>{s.nombre}</h1>
      <div className="skill-progreso">
        <Barra valor={s.puntos} max={arbol.max_puntos} />
        <p className="ayuda">{s.puntos} / {arbol.max_puntos} puntos{s.estado === 'dominada' && ' · ¡Skill dominada!'}</p>
      </div>
      {s.estado === 'bloqueada' ? (
        <p className="ayuda">Esta skill está bloqueada: domina primero las skills anteriores.</p>
      ) : (
        <div className="acciones">
          <Link className="btn" to={`/leccion/${id}`}>Hacer lección</Link>
          <Link className="btn btn-azul" to={`/traducir/${id}`}>Traducir textos reales</Link>
        </div>
      )}
    </div>
  );
}
