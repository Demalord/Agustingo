-- 02_funciones.sql — toda la lógica del MVP. Correr después de 01.
-- Todas SECURITY DEFINER con search_path vacío: todo va calificado con su esquema.

-- Fuente única de verdad del árbol y las constantes del juego
create or replace function public.arbol_definicion()
returns jsonb language sql immutable set search_path = '' as $$
  select '{
    "max_puntos": 50, "puntos_leccion": 10, "puntos_texto": 5,
    "corazones": 3, "preguntas_por_leccion": 8, "umbral_texto": 0.6,
    "skills": [
      {"id": "basico1",  "nombre": "Básico 1", "fila": 1, "requiere": []},
      {"id": "basico2",  "nombre": "Básico 2", "fila": 2, "requiere": ["basico1"]},
      {"id": "saludos",  "nombre": "Saludos",  "fila": 2, "requiere": ["basico1"]},
      {"id": "comida",   "nombre": "Comida",   "fila": 3, "requiere": ["basico2"]},
      {"id": "animales", "nombre": "Animales", "fila": 3, "requiere": ["basico2"]},
      {"id": "plurales", "nombre": "Plurales", "fila": 4, "requiere": ["comida", "animales"]},
      {"id": "verbos",   "nombre": "Verbos",   "fila": 5, "requiere": ["plurales", "saludos"]}
    ]}'::jsonb
$$;

-- minúsculas, sin tildes, sin apóstrofos, sin puntuación, espacios colapsados
-- (unaccent con diccionario explícito porque la versión de 1 argumento depende del search_path)
create or replace function public.normalizar(t text)
returns text language sql stable set search_path = '' as $$
  select trim(regexp_replace(
    translate(lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, ''))), '''’', ''),
    '[^a-z0-9]+', ' ', 'g'))
$$;

create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select rol = 'admin' from public.usuarios where id = auth.uid()), false)
$$;

-- Curso del usuario actual; error si no hay sesión
create or replace function public.mi_curso()
returns text language plpgsql stable security definer set search_path = '' as $$
declare v text;
begin
  select curso_actual into v from public.usuarios where id = auth.uid();
  if v is null then raise exception 'No autenticado'; end if;
  return v;
end $$;

-- Interna: la skill existe y todas sus requeridas están dominadas
create or replace function public.skill_disponible(p_uid uuid, p_curso text, p_skill text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from jsonb_array_elements(public.arbol_definicion()->'skills') s where s->>'id' = p_skill)
     and not exists (
       select 1
       from jsonb_array_elements(public.arbol_definicion()->'skills') s,
            jsonb_array_elements_text(s->'requiere') req
       where s->>'id' = p_skill
         and not exists (select 1 from public.progreso p
                         where p.usuario_id = p_uid and p.curso = p_curso and p.skill = req and p.dominada))
$$;
revoke execute on function public.skill_disponible(uuid, text, text) from public, anon, authenticated;

-- Impide que un no-admin se cambie el rol o el email (el email lo maneja Auth + sincronizar_email).
-- auth.uid() es null en el SQL Editor y en los triggers de Auth, por eso esos casos pasan.
create or replace function public.proteger_usuario()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null and new.rol is distinct from old.rol and not public.es_admin() then
    raise exception 'Solo un admin puede cambiar el rol';
  end if;
  if auth.uid() is not null and (new.email is distinct from old.email or new.id is distinct from old.id) then
    raise exception 'El email se cambia desde Auth';
  end if;
  return new;
end $$;

create trigger proteger_usuario
  before update on public.usuarios
  for each row execute function public.proteger_usuario();

-- ───────────── Estudiante ─────────────

create or replace function public.obtener_arbol()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid   uuid  := auth.uid();
  v_curso text  := public.mi_curso();
  v_def   jsonb := public.arbol_definicion();
begin
  return jsonb_build_object(
    'curso', v_curso,
    'max_puntos', v_def->'max_puntos',
    'skills', (
      select jsonb_agg(s.skill || jsonb_build_object(
               'puntos', coalesce(p.puntos, 0),
               'estado', case when p.dominada then 'dominada'
                              when public.skill_disponible(v_uid, v_curso, s.skill->>'id') then 'disponible'
                              else 'bloqueada' end)
             order by s.ord)
      from jsonb_array_elements(v_def->'skills') with ordinality as s(skill, ord)
      left join public.progreso p
        on p.usuario_id = v_uid and p.curso = v_curso and p.skill = s.skill->>'id'));
end $$;

create or replace function public.iniciar_leccion(p_skill text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid  := auth.uid();
  v_curso text  := public.mi_curso();
  v_def   jsonb := public.arbol_definicion();
  v_ids   bigint[];
begin
  if not public.skill_disponible(v_uid, v_curso, p_skill) then
    raise exception 'Skill bloqueada';
  end if;

  select array_agg(q.id) into v_ids from (
    select id from public.preguntas
    where curso = v_curso and skill = p_skill and tipo <> 'texto_real'
    order by random()
    limit (v_def->>'preguntas_por_leccion')::int) q;
  if v_ids is null then raise exception 'Esta skill no tiene preguntas'; end if;

  insert into public.progreso (usuario_id, curso, skill, leccion_preguntas, leccion_indice, leccion_corazones)
  values (v_uid, v_curso, p_skill, v_ids, 0, (v_def->>'corazones')::int)
  on conflict (usuario_id, curso, skill) do update
    set leccion_preguntas = excluded.leccion_preguntas,
        leccion_indice    = 0,
        leccion_corazones = excluded.leccion_corazones;

  return jsonb_build_object(
    'corazones', (v_def->>'corazones')::int,
    'preguntas', (
      select jsonb_agg(jsonb_build_object('id', p.id, 'tipo', p.tipo, 'pregunta', p.pregunta, 'opciones', p.opciones)
                       order by u.ord)
      from unnest(v_ids) with ordinality as u(id, ord)
      join public.preguntas p on p.id = u.id));
end $$;

create or replace function public.responder(p_skill text, p_respuesta text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid       uuid    := auth.uid();
  v_curso     text    := public.mi_curso();
  v_def       jsonb   := public.arbol_definicion();
  v_max       int     := (v_def->>'max_puntos')::int;
  r           public.progreso%rowtype;
  v_preg      public.preguntas%rowtype;
  v_ok        boolean;
  v_terminada boolean := false;
  v_aprobada  boolean := false;
begin
  select * into r from public.progreso
  where usuario_id = v_uid and curso = v_curso and skill = p_skill
  for update;
  if r.leccion_preguntas is null then raise exception 'No hay una lección en curso'; end if;

  select * into v_preg from public.preguntas where id = r.leccion_preguntas[r.leccion_indice + 1];
  if v_preg.id is null then raise exception 'La pregunta ya no existe, reinicia la lección'; end if;

  v_ok := exists (select 1 from unnest(string_to_array(v_preg.respuesta, '|')) a
                  where public.normalizar(a) = public.normalizar(p_respuesta));

  r.leccion_indice := r.leccion_indice + 1;
  if not v_ok then r.leccion_corazones := r.leccion_corazones - 1; end if;

  if r.leccion_corazones <= 0 then
    v_terminada := true;
  elsif r.leccion_indice >= cardinality(r.leccion_preguntas) then
    v_terminada := true;
    v_aprobada  := true;
    r.puntos    := least(v_max, r.puntos + (v_def->>'puntos_leccion')::int);
    r.dominada  := r.dominada or r.puntos >= v_max;
  end if;

  update public.progreso set
    leccion_indice    = r.leccion_indice,
    leccion_corazones = r.leccion_corazones,
    leccion_preguntas = case when v_terminada then null else leccion_preguntas end,
    puntos            = r.puntos,
    dominada          = r.dominada
  where id = r.id;

  return jsonb_build_object(
    'correcto', v_ok,
    'respuesta_correcta', split_part(v_preg.respuesta, '|', 1),
    'corazones', r.leccion_corazones,
    'terminada', v_terminada,
    'aprobada', v_aprobada,
    'puntos', r.puntos,
    'dominada', r.dominada);
end $$;

create or replace function public.obtener_textos(p_skill text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_curso text := public.mi_curso();
begin
  if not public.skill_disponible(auth.uid(), v_curso, p_skill) then
    raise exception 'Skill bloqueada';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'pregunta', pregunta, 'opciones', opciones) order by id)
    from public.preguntas
    where curso = v_curso and skill = p_skill and tipo = 'texto_real'), '[]'::jsonb);
end $$;

-- shortcut: un mismo texto se puede repetir para sumar puntos; si molesta, guardar los ids traducidos en progreso
create or replace function public.traducir_texto(p_id bigint, p_traduccion text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid  := auth.uid();
  v_curso  text  := public.mi_curso();
  v_def    jsonb := public.arbol_definicion();
  v_max    int   := (v_def->>'max_puntos')::int;
  v_pts    int   := (v_def->>'puntos_texto')::int;
  v_preg   public.preguntas%rowtype;
  v_sim    real;
  v_ok     boolean;
  v_puntos int;
begin
  select * into v_preg from public.preguntas where id = p_id and tipo = 'texto_real' and curso = v_curso;
  if v_preg.id is null then raise exception 'Texto no encontrado'; end if;
  if not public.skill_disponible(v_uid, v_curso, v_preg.skill) then raise exception 'Skill bloqueada'; end if;

  select max(extensions.similarity(public.normalizar(p_traduccion), public.normalizar(a))) into v_sim
  from unnest(string_to_array(v_preg.respuesta, '|')) a;
  v_ok := v_sim >= (v_def->>'umbral_texto')::real;

  if v_ok then
    insert into public.progreso as pr (usuario_id, curso, skill, puntos, dominada)
    values (v_uid, v_curso, v_preg.skill, least(v_max, v_pts), v_pts >= v_max)
    on conflict (usuario_id, curso, skill) do update
      set puntos   = least(v_max, pr.puntos + v_pts),
          dominada = pr.dominada or pr.puntos + v_pts >= v_max
    returning puntos into v_puntos;
  else
    select puntos into v_puntos from public.progreso
    where usuario_id = v_uid and curso = v_curso and skill = v_preg.skill;
  end if;

  return jsonb_build_object(
    'porcentaje', round(v_sim * 100),
    'aceptada', v_ok,
    'referencia', split_part(v_preg.respuesta, '|', 1),
    'puntos', coalesce(v_puntos, 0));
end $$;

create or replace function public.cambiar_curso(p_curso text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_curso is null or p_curso not in ('en', 'it') then raise exception 'Curso inválido'; end if;
  update public.usuarios set curso_actual = p_curso where id = auth.uid();
  if not found then raise exception 'No autenticado'; end if;
end $$;

create or replace function public.eliminar_mi_cuenta()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  delete from auth.users where id = auth.uid();  -- cascada: usuarios → progreso
end $$;

-- ───────────── Admin ─────────────

create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'Solo admin'; end if;
  return jsonb_build_object(
    'usuarios', (select count(*) from public.usuarios),
    'dominadas', (select count(*) from public.progreso where dominada),
    'preguntas', coalesce((
      select jsonb_agg(jsonb_build_object('curso', curso, 'skill', skill, 'total', n) order by curso, skill)
      from (select curso, skill, count(*) n from public.preguntas group by curso, skill) t), '[]'::jsonb));
end $$;

create or replace function public.admin_actualizar_usuario(p_id uuid, p_nombre text, p_rol text, p_curso text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'Solo admin'; end if;
  update public.usuarios set
    nombre       = coalesce(nullif(trim(p_nombre), ''), nombre),
    rol          = p_rol,     -- los CHECK de la tabla validan rol y curso
    curso_actual = p_curso
  where id = p_id;
  if not found then raise exception 'Usuario no encontrado'; end if;
end $$;

create or replace function public.admin_eliminar_usuario(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.es_admin() then raise exception 'Solo admin'; end if;
  delete from auth.users where id = p_id;
  if not found then raise exception 'Usuario no encontrado'; end if;
end $$;
