# Agustingo

Réplica funcional del MVP web de una app de idiomas de 2012, hecha como proyecto universitario. Cursos de **inglés** e **italiano** para hispanohablantes: árbol de skills, lecciones con corazones y traducción de textos reales con pistas.

- **Frontend:** React + Vite + React Router + supabase-js, CSS propio, fuente Nunito empaquetada (funciona offline en el APK).
- **Backend:** Supabase (PostgreSQL + Auth). No hay servidor propio: la lógica sensible vive en funciones PL/pgSQL (`SECURITY DEFINER`) que se llaman con `supabase.rpc()`, y la seguridad va con RLS. Las respuestas correctas nunca llegan al cliente.
- **Móvil:** Capacitor 7 (Android).

```
supabase/   01_schema.sql · 02_funciones.sql · 03_rls.sql · 04_seed.sql
frontend/   app Vite + React + Capacitor (android/, assets/, scripts/assets.mjs)
.github/workflows/android.yml   APK debug en cada push
```

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **Authentication → Sign In / Providers → Email:** desactiva **Confirm email** (si no, nadie puede entrar hasta confirmar su correo y el admin crearía cuentas sin confirmar).
3. En **SQL Editor**, pega y ejecuta cada archivo completo, **en este orden**:
   1. `supabase/01_schema.sql`: extensiones (`unaccent`, `pg_trgm`), las 3 tablas, trigger que crea el perfil al registrarse
   2. `supabase/02_funciones.sql`: árbol de skills, normalización y todas las RPC
   3. `supabase/03_rls.sql`: políticas de seguridad
   4. `supabase/04_seed.sql`: 112 preguntas (7 skills × 2 cursos). Al final trae `assert`s; si dice *Success*, todo está bien. **Ojo:** empieza con `truncate`, así que borra las preguntas existentes.

## 2. Correr en local

```bash
cd frontend
cp .env.example .env      # y pon tus valores
npm install
npm run dev               # http://localhost:5173
```

`.env` necesita (Supabase → Project Settings → API):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   (anon / publishable key, nunca la service_role)
```

## 3. Volverse admin

1. Regístrate en la app normalmente.
2. En el SQL Editor de Supabase:
   ```sql
   update public.usuarios set rol = 'admin' where email = 'tu@correo.com';
   ```
3. Cierra sesión y vuelve a entrar: aparece el enlace **Admin** en el header.

Desde la app, un admin también puede convertir a otros usuarios en admin (pestaña Usuarios).

## 4. Generar el APK en local

Requisitos: **JDK 21** (Capacitor 7 no compila con 17, ni con el JDK 25 que trae Android Studio reciente) y el Android SDK (viene con Android Studio).

```bash
cd frontend
npm run android                 # vite build + cap sync android
cd android
./gradlew assembleDebug         # en Windows: gradlew.bat assembleDebug
```

El APK queda en `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.

Si Gradle no encuentra Java o el SDK, define antes `JAVA_HOME` (carpeta del JDK 21) y `ANDROID_HOME` (en Windows suele ser `%LOCALAPPDATA%\Android\Sdk`). También puedes abrir el proyecto con `npx cap open android` y compilar desde Android Studio (Build → Build APK).

**Ícono y splash:** se generan desde SVG con `npm run assets` (crea `assets/icon.png` 1024 px y `assets/splash.png` 2732 px, y luego `@capacitor/assets` produce todas las densidades de Android).

## 5. APK con GitHub Actions

El workflow `.github/workflows/android.yml` compila el APK debug en cada push.

1. En GitHub: **Settings → Secrets and variables → Actions → New repository secret**, crea:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Haz push (o ve a **Actions → APK Android → Run workflow**).
3. Al terminar, descarga el APK desde la ejecución, en **Artifacts → agustingo-debug-apk**.

## Modelo de datos

| Tabla | Para qué |
|---|---|
| `usuarios` | perfil (nombre, email, rol, curso actual); la contraseña la maneja Supabase Auth |
| `preguntas` | banco de preguntas por curso y skill; `respuesta` admite varias separadas por `\|` |
| `progreso` | puntos y dominio por usuario/curso/skill, más el estado de la lección en curso (`leccion_*`) para validar todo en el servidor |

El árbol de skills no es una tabla: lo define `arbol_definicion()` en `02_funciones.sql`, junto con las constantes (50 puntos para dominar, +10 por lección, +5 por texto, 3 corazones, 8 preguntas, 60 % de similitud).
