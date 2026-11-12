-- 01_schema.sql — extensiones, las 3 tablas y triggers de perfil. Correr primero.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create table public.usuarios (
  id           uuid primary key references auth.users on delete cascade,
  nombre       text not null,
  email        text not null unique,
  rol          text not null default 'estudiante' check (rol in ('estudiante', 'admin')),
  curso_actual text not null default 'en' check (curso_actual in ('en', 'it')),
  creado_en    timestamptz not null default now()
);

create table public.preguntas (
  id        bigint generated always as identity primary key,
  curso     text not null check (curso in ('en', 'it')),
  skill     text not null,
  tipo      text not null check (tipo in ('opcion', 'traducir_es_a_idioma', 'traducir_idioma_a_es', 'texto_real')),
  pregunta  text not null,
  opciones  jsonb,          -- lista si tipo=opcion; {palabra: significado} si tipo=texto_real
  respuesta text not null   -- varias válidas separadas por "|"; la primera es la "oficial"
);
create index preguntas_curso_skill_idx on public.preguntas (curso, skill);

create table public.progreso (
  id                bigint generated always as identity primary key,
  usuario_id        uuid not null references public.usuarios on delete cascade,
  curso             text not null check (curso in ('en', 'it')),
  skill             text not null,
  puntos            int not null default 0,
  dominada          boolean not null default false,
  leccion_preguntas bigint[],          -- lección en curso (null = ninguna)
  leccion_indice    int not null default 0,
  leccion_corazones int not null default 3,
  unique (usuario_id, curso, skill)
);

-- Al registrarse en Auth se crea el perfil (nombre y curso vienen de options.data del signUp)
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.usuarios (id, nombre, email, curso_actual)
  values (
    new.id,
    -- 'nombre' viene del registro con email; 'full_name'/'name' del login con Google
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''),
             nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
             nullif(trim(new.raw_user_meta_data->>'name'), ''),
             split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_user_meta_data->>'curso' in ('en', 'it') then new.raw_user_meta_data->>'curso' else 'en' end
  );
  return new;
end $$;

create trigger al_registrarse
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- Si el usuario cambia su email con auth.updateUser, se refleja en usuarios
create or replace function public.sincronizar_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.usuarios set email = new.email where id = new.id;
  return new;
end $$;

create trigger al_cambiar_email
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sincronizar_email();
