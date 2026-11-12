-- 03_rls.sql — seguridad por filas. Correr después de 02.

alter table public.usuarios  enable row level security;
alter table public.preguntas enable row level security;
alter table public.progreso  enable row level security;

-- usuarios: cada uno ve y edita su fila; el admin ve todas (el trigger proteger_usuario cuida rol/email)
create policy usuarios_select on public.usuarios
  for select to authenticated
  using (id = (select auth.uid()) or public.es_admin());

create policy usuarios_update on public.usuarios
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- altas y bajas de usuarios solo por el trigger de Auth y las funciones
revoke insert, delete on public.usuarios from anon, authenticated;

-- preguntas: CRUD directo solo para admin; los estudiantes las ven vía funciones (sin respuesta)
create policy preguntas_admin on public.preguntas
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

revoke all on public.preguntas from anon;

-- progreso: cada uno lee lo suyo; las escrituras solo por funciones
create policy progreso_select on public.progreso
  for select to authenticated
  using (usuario_id = (select auth.uid()));

revoke insert, update, delete on public.progreso from anon, authenticated;
