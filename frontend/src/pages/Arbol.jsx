import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { CURSOS, rpc } from '../supabase';
import Barra from '../Barra';

export const iniciales = nombre => nombre.split(' ').map(p => p[0]).join('');

export default function Arbol() {
  const { perfil } = useAuth();
  const [arbol, setArbol] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setArbol(null);
    rpc('obtener_arbol').then(setArbol, e => setError(e.message));
  }, [perfil.curso_actual]);

  if (error) return <p className="error">{error}</p>;
  if (!arbol) return <p className="cargando">Cargando…</p>;

  const filas = [];
  arbol.skills.forEach(s => (filas[s.fila] ??= []).push(s));
  const dominadas = arbol.skills.filter(s => s.estado === 'dominada').length;

  return (
    <div className="caja">
      <div className="titulo-arbol">
        <h1>Curso de {CURSOS[arbol.curso]}</h1>
        <span className="ayuda">{dominadas} de {arbol.skills.length} skills dominadas</span>
      </div>
      <div className="arbol">
        {filas.filter(Boolean).map((fila, i) => (
          <div className="fila" key={i}>
            {fila.map(s => <SkillCirculo key={s.id} s={s} max={arbol.max_puntos} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillCirculo({ s, max }) {
  const contenido = (
    <>
      <span className="circulo">{iniciales(s.nombre)}</span>
      <span className="skill-nombre">{s.nombre}</span>
      <Barra valor={s.puntos} max={max} />
    </>
  );
  return s.estado === 'bloqueada'
    ? <div className="skill bloqueada" title="Domina las skills anteriores para desbloquearla">{contenido}</div>
    : <Link to={`/skill/${s.id}`} className={`skill ${s.estado}`}>{contenido}</Link>;
}
