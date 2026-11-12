import { HashRouter, Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { CURSOS, rpc, supabase } from './supabase';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Arbol from './pages/Arbol';
import Skill from './pages/Skill';
import Leccion from './pages/Leccion';
import Traducir from './pages/Traducir';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';

// HashRouter: en el APK no hay servidor que reescriba rutas
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Header />
        <main className="contenedor">
          <Routes>
            <Route path="/login" element={<SoloInvitado><Login /></SoloInvitado>} />
            <Route path="/registro" element={<SoloInvitado><Registro /></SoloInvitado>} />
            <Route path="/" element={<Protegida><Arbol /></Protegida>} />
            <Route path="/skill/:id" element={<Protegida><Skill /></Protegida>} />
            <Route path="/leccion/:id" element={<Protegida><Leccion /></Protegida>} />
            <Route path="/traducir/:id" element={<Protegida><Traducir /></Protegida>} />
            <Route path="/perfil" element={<Protegida><Perfil /></Protegida>} />
            <Route path="/admin" element={<Protegida admin><Admin /></Protegida>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </HashRouter>
    </AuthProvider>
  );
}

function Protegida({ admin, children }) {
  const { session, perfil, cargando } = useAuth();
  if (cargando) return <p className="cargando">Cargando…</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (admin && perfil.rol !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function SoloInvitado({ children }) {
  const { session, cargando } = useAuth();
  if (cargando) return <p className="cargando">Cargando…</p>;
  return session ? <Navigate to="/" replace /> : children;
}

function Header() {
  const { perfil, refrescarPerfil } = useAuth();
  const navigate = useNavigate();

  async function cambiarCurso(e) {
    try {
      await rpc('cambiar_curso', { p_curso: e.target.value });
      await refrescarPerfil();
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <header className="header">
      <div className="header-in">
        <Link to="/" className="logo">agustingo</Link>
        {perfil && (
          <>
            <select className="selector-curso" value={perfil.curso_actual} onChange={cambiarCurso} aria-label="Curso">
              {Object.entries(CURSOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <nav className="nav">
              <NavLink to="/" end>Árbol</NavLink>
              <NavLink to="/perfil">{perfil.nombre}</NavLink>
              {perfil.rol === 'admin' && <NavLink to="/admin">Admin</NavLink>}
              <button className="link" onClick={() => supabase.auth.signOut()}>Salir</button>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
