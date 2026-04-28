## Mode Train

Mode Train es una aplicacion privada de entrenamiento personal, construida como PWA mobile-first, para gestionar rutinas de fuerza, sesiones de gym, agenda semanal, running, historial y progreso.

La direccion de producto es premium y sobria: base oscura, superficies contenidas, morado como acento y una experiencia pensada para usarse rapido desde el movil.

## Indice

- [Estado actual](#estado-actual)
- [Objetivo de la app](#objetivo-de-la-app)
- [Stack tecnico](#stack-tecnico)
- [Flujos principales](#flujos-principales)
- [Arquitectura](#arquitectura)
- [Rutas](#rutas)
- [Modelo de datos](#modelo-de-datos)
- [Autenticacion y sesiones](#autenticacion-y-sesiones)
- [Entrenamiento de fuerza](#entrenamiento-de-fuerza)
- [Running](#running)
- [Agenda, resumen y progreso](#agenda-resumen-y-progreso)
- [Diseno y UI](#diseno-y-ui)
- [Entorno local](#entorno-local)
- [Base de datos y seeds](#base-de-datos-y-seeds)
- [Calidad y tests](#calidad-y-tests)
- [Docker y despliegue](#docker-y-despliegue)
- [Limitaciones actuales](#limitaciones-actuales)
- [Mapa de archivos](#mapa-de-archivos)

## Estado actual

- App funcional con login, registro, onboarding y shell privada.
- Dashboard principal en `/app` con tabs internas: Inicio, Agenda, Resumen y Yo.
- Gestion de rutinas, ejercicios de sistema y ejercicios custom.
- Editor de rutinas con foco visual, orden, objetivos por ejercicio y notas.
- Sesiones de gym con sets, ultimo rendimiento, cierre y cancelacion.
- Registro de running con distancia, duracion, ritmo medio y notas.
- Historial de workouts y carreras.
- Progreso derivado desde entrenamientos completados.
- PWA mobile-first con manifest.
- Stack Docker local/produccion con app + PostgreSQL.

El nombre tecnico actual es `mode-train` y el dominio objetivo es `train.jmdcore.com`.

## Objetivo de la app

Mode Train busca ser un espacio personal y privado para entrenar con continuidad. No intenta ser una red social publica ni un panel administrativo complejo. Su foco actual es:

- Planificar la semana.
- Crear rutinas de fuerza reutilizables.
- Registrar sesiones reales de entrenamiento.
- Guardar carreras.
- Ver resumen, historial y progreso sin mantener metricas duplicadas.

La filosofia de datos es importante: la mayoria de indicadores se calculan desde registros reales. Si cambian las sesiones, sets o carreras, cambian tambien los KPIs, resumenes y cards de progreso.

## Stack tecnico

- Framework: `Next.js 16.2.2` con App Router.
- UI: `React 19.2.4`.
- Animacion: `motion`.
- Iconos: `lucide-react`.
- Base de datos: `PostgreSQL 16`.
- ORM y migraciones: `Drizzle`.
- Validacion: `zod`.
- Password hashing: `@node-rs/argon2`.
- Runtime de contenedor: `Node 24`.
- E2E: `Playwright`.
- CSS: clases globales y tokens en `src/app/globals.css`.
- Build de produccion: `next.config.ts` con `output: "standalone"`.

## Flujos principales

### Entrada y acceso

La ruta `/` decide a donde enviar al usuario:

- Sin sesion: redirige a `/login`.
- Con sesion y perfil incompleto: redirige a `/onboarding`.
- Con sesion y perfil completo: redirige a `/app`.

### Registro

Ruta: `/register`

El registro crea:

- usuario en `app_users`
- perfil base en `profiles`
- sesion inicial en `user_sessions`
- cookie HTTP-only de sesion

Despues redirige al onboarding si el perfil no esta completo.

### Login

Ruta: `/login`

El login:

- normaliza el email
- busca el usuario
- verifica el password con Argon2
- crea una sesion persistida
- escribe la cookie
- redirige segun el estado del perfil

### Onboarding

Ruta: `/onboarding`

Completa los datos necesarios para desbloquear la app:

- nombre visible
- objetivo
- nivel de experiencia
- sesiones semanales preferidas
- altura
- peso

Un perfil se considera completo si tiene `goal`, `experienceLevel` y `preferredWeeklySessions > 0`.

### Uso diario

El flujo normal dentro de la app es:

1. Abrir `/app`.
2. Revisar el estado de la semana.
3. Planificar gym o running en Agenda.
4. Iniciar una rutina o registrar una carrera.
5. Completar la sesion.
6. Consultar historial, resumen y progreso.

## Arquitectura

La app esta organizada en capas claras:

- `src/app/`: rutas de Next.js, layout, manifest y API routes.
- `src/components/`: componentes visuales reutilizables.
- `src/components/app-shell/`: shell principal y dashboard privado.
- `src/components/auth/`: formularios de login y registro.
- `src/components/onboarding/`: flujo de perfil inicial.
- `src/components/training/`: rutinas, sesiones, historial, running y progreso.
- `src/components/visuals/`: visuales especificos del producto.
- `src/server/`: logica de servidor, acciones y consultas.
- `src/server/db/`: cliente Drizzle y esquema de datos.
- `drizzle/`: migraciones generadas.
- `scripts/`: seeds y smoke tests.
- `tests/e2e/`: tests Playwright.
- `docs/`: documentacion funcional extendida.

### Snapshot central

La shell principal consume un snapshot agregado desde `src/server/app/snapshot.ts`.

Ese snapshot combina:

- usuario autenticado
- perfil
- workout activo
- agenda semanal
- resumen global
- rutinas recientes
- conteo de ejercicios del sistema y custom

Esto permite que `/app` cargue una vista completa sin que cada widget replique sus propias consultas.

## Rutas

### Publicas y de acceso

- `/`: entrada inteligente con redirecciones.
- `/login`: login.
- `/register`: registro.
- `/onboarding`: completar o editar perfil.
- `/logout`: cierra sesion via `GET` o `POST`.
- `/api/health`: healthcheck de la app.

### App privada

- `/app`: shell principal.
- `/app/routines`: hub de rutinas y biblioteca de ejercicios.
- `/app/routines/[routineId]`: editor de una rutina.
- `/app/workouts/[sessionId]`: sesion de gym activa o detalle editable.
- `/app/history`: historial agregado.
- `/app/history/workouts/[sessionId]`: detalle de workout.
- `/app/history/runs/[runId]`: detalle de carrera.
- `/app/progress`: progreso detallado.

Todas las rutas privadas requieren usuario autenticado y perfil completo.

## Modelo de datos

Las tablas principales estan definidas en `src/server/db/schema.ts`.

### Identidad y perfil

- `app_users`: email, password hash y timestamps.
- `profiles`: nombre, bio, objetivo, nivel, altura, peso y sesiones preferidas.
- `user_sessions`: sesiones persistidas con token hasheado y expiracion.

### Biblioteca y rutinas

- `exercise_categories`: categorias del sistema o creadas por usuario.
- `exercises`: ejercicios del sistema y ejercicios custom.
- `routine_templates`: plantillas de rutina del usuario.
- `routine_template_items`: ejercicios dentro de una rutina, con sets objetivo, reps, RIR, descanso, notas y orden.

### Planificacion y actividad

- `weekly_plan_entries`: plan semanal base por dia.
- `training_schedule_entries`: agenda explicita por fecha para gym o running.
- `workout_sessions`: sesiones de gym abiertas o cerradas.
- `workout_sets`: sets registrados por ejercicio dentro de una sesion.
- `running_sessions`: carreras guardadas.

### Preparado para futuro

- `progress_photos`: fotos de progreso.
- `friendships`: relaciones sociales.
- `notifications`: avisos.

Estas tablas existen, pero no todas tienen todavia un flujo completo en la interfaz.

## Autenticacion y sesiones

La autenticacion es propia de la app:

- Passwords hasheados con Argon2.
- Sesiones guardadas en `user_sessions`.
- Token de sesion guardado como hash en base de datos.
- Cookie HTTP-only para el cliente.
- Logout destruye la sesion y limpia la cookie.

Archivos clave:

- `src/server/auth/actions.ts`
- `src/server/auth/session.ts`
- `src/server/auth/user.ts`
- `src/server/auth/password.ts`
- `src/server/auth/config.ts`

## Entrenamiento de fuerza

### Hub de rutinas

Ruta: `/app/routines`

Permite:

- ver rutinas existentes
- crear rutinas nuevas
- iniciar entrenamiento desde una rutina
- revisar la biblioteca de ejercicios
- crear ejercicios custom

Tambien muestra informacion util como numero de ejercicios, foco visual y ultima fecha planificada.

### Editor de rutina

Ruta: `/app/routines/[routineId]`

Permite:

- cambiar nombre y foco visual
- anadir ejercicios desde la libreria
- editar sets objetivo
- editar rango de repeticiones
- definir RIR objetivo
- indicar descanso
- anadir notas
- mover ejercicios
- eliminar ejercicios

Reglas relevantes:

- Una rutina vacia no puede iniciarse.
- El orden de items se normaliza para evitar huecos.
- El foco puede ser manual o inferido desde los grupos musculares.

### Sesion de gym

Ruta: `/app/workouts/[sessionId]`

Una sesion:

- pertenece a un usuario
- puede estar asociada a una rutina
- tiene fecha `performedOn`
- puede estar abierta o cerrada
- contiene sets por ejercicio

Reglas de negocio:

- Solo puede haber una sesion abierta por usuario.
- Si ya hay una sesion abierta, la app puede reanudarla.
- No se puede cerrar una sesion sin sets guardados.
- Guardar un bloque de ejercicio reemplaza el bloque previo de ese ejercicio en esa sesion.
- Las sesiones cerradas siguen siendo visibles desde historial.

## Running

La parte de running permite planificar y registrar carreras.

Tipos soportados:

- `easy`
- `tempo`
- `intervals`
- `long_run`
- `recovery`
- `free`

Un registro de running puede incluir:

- tipo de salida
- fecha
- distancia
- duracion
- ritmo medio calculado
- notas
- visibilidad

Archivos clave:

- `src/server/training/running.ts`
- `src/components/training/quick-run-form.tsx`
- `src/components/training/run-history-detail.tsx`

## Agenda, resumen y progreso

### Agenda

La agenda vive dentro de la tab `Agenda` de `/app`.

Permite:

- planificar gym por fecha
- planificar running por fecha
- registrar una carrera hecha
- iniciar una rutina planificada
- borrar entradas planificadas

La app diferencia entre planificar y completar:

- Una entrada planificada vive en `training_schedule_entries`.
- Un workout completado vive en `workout_sessions`.
- Una carrera completada vive en `running_sessions`.

Los completados semanales se calculan desde actividad real, no desde una marca manual en la agenda.

### Resumen

La tab `Resumen` agrupa informacion en tres vistas:

- General: balance entre gym, running y rutinas.
- Body: records y foco corporal.
- Running: distancia, ritmos y actividad de carrera.

Scopes disponibles:

- semana
- mes
- total

### Progreso

Ruta: `/app/progress`

El progreso se deriva de workouts cerrados y muestra:

- sesiones
- sets
- volumen
- runs
- ultima marca por ejercicio
- mejor marca por ejercicio
- tendencia frente al bloque anterior
- milestones generados

No existe una tabla de records materializados: los records se calculan desde `workout_sets` y `workout_sessions`.

## Diseno y UI

La app sigue un sistema visual global:

- Tokens en `src/app/globals.css`.
- Tipografias en `src/app/layout.tsx`.
- `Sora` para headings y momentos de producto.
- `Manrope` para interfaz.
- `JetBrains Mono` para datos o fragmentos tecnicos.
- Iconos desde `lucide-react`.

Reglas de estilo del proyecto:

- mobile-first
- superficies oscuras y legibles
- morado solo como acento
- acciones claras con `primary-button`, `secondary-button` y `ghost-button`
- formularios con estilos compartidos
- movimiento sutil con `motion/react`
- sin UI kits externos

## Entorno local

### Requisitos

- Node compatible con el proyecto.
- npm.
- Docker si se quiere levantar PostgreSQL local con compose.

### Variables de entorno

Copia el ejemplo:

```bash
cp .env.example .env
```

Variables principales:

- `NODE_ENV`: entorno de ejecucion.
- `PORT`: puerto de la app.
- `APP_URL`: URL base.
- `POSTGRES_DB`: nombre de base de datos.
- `POSTGRES_USER`: usuario de PostgreSQL.
- `POSTGRES_PASSWORD`: password de PostgreSQL.
- `DATABASE_URL`: conexion completa.
- `AUTH_SESSION_SECRET`: secreto para sesiones.
- `FILES_DIR`: almacenamiento de archivos.

En Docker, `DATABASE_URL` apunta al servicio `db`. En desarrollo fuera de Docker puede ser necesario apuntarla a `localhost`.

### Desarrollo

```bash
npm install
npm run dev
```

Healthcheck local:

```bash
curl http://localhost:3000/api/health
```

## Base de datos y seeds

### Migraciones

Generar migraciones Drizzle:

```bash
npm run db:generate
```

Abrir Drizzle Studio:

```bash
npm run db:studio
```

### Seed de sistema

```bash
npm run db:seed
```

Inserta categorias y ejercicios base.

### Seed demo

```bash
npm run demo:seed
```

Crea o refresca una cuenta demo con:

- perfil completo
- rutinas
- agenda
- sesiones de gym
- carreras
- progreso
- sesion abierta

Los scripts usan `scripts/with-docker-db.sh` para ejecutar contra la base de datos Docker cuando aplica.

## Calidad y tests

Comandos principales:

```bash
npm run lint
npm run typecheck
npm run build
npm run check
```

Smoke tests disponibles:

```bash
npm run auth:smoke
npm run starter:smoke
npm run routine-editor:smoke
npm run workout:smoke
npm run insights:smoke
npm run schedule:smoke
npm run running:smoke
```

Playwright:

```bash
npm run e2e:install
npm run e2e
```

La suite E2E cubre registro, onboarding, shell movil, creacion de rutina, guardado de sets y cierre de sesion.

## Docker y despliegue

Levantar stack local o Raspberry:

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Servicios:

- `db`: PostgreSQL 16 Alpine.
- `mode-train`: app Next.js standalone.

Volumenes:

- `modetrain_db_data`: datos de PostgreSQL.
- `modetrain_storage`: almacenamiento de la app.

Redes:

- `internal`: comunicacion app-db.
- `edge`: red externa para proxy/reverse proxy.

Healthchecks:

- DB: `pg_isready`.
- App: fetch a `http://127.0.0.1:3000/api/health`.

El contenedor de app expone `3000` y ejecuta `node server.js` desde el build standalone.

## Limitaciones actuales

- La campana de avisos existe visualmente, pero no abre una bandeja funcional.
- `notifications` existe en base de datos, pero no tiene flujo completo.
- `friendships` existe como base social futura, pero no hay producto social terminado.
- `progress_photos` esta preparado en schema, pero no hay subida/gestion de fotos en UI.
- No hay roles ni panel de administracion.
- `weekly_plan_entries` existe como base de plan semanal, mientras la agenda principal actual usa entradas explicitas por fecha.
- La app esta orientada a uso privado de un usuario, aunque el modelo ya separa datos por `userId`.

## Mapa de archivos

- `src/app/page.tsx`: redireccion inicial.
- `src/app/app/page.tsx`: entrada protegida a la shell.
- `src/app/login/page.tsx`: pagina de login.
- `src/app/register/page.tsx`: pagina de registro.
- `src/app/onboarding/page.tsx`: perfil inicial.
- `src/app/api/health/route.ts`: healthcheck.
- `src/components/app-shell/mode-train-app.tsx`: dashboard y tabs principales.
- `src/components/training/routines-hub.tsx`: hub de rutinas.
- `src/components/training/routine-editor.tsx`: editor de rutina.
- `src/components/training/workout-session.tsx`: sesion de gym.
- `src/components/training/history-overview.tsx`: historial.
- `src/components/training/progress-overview.tsx`: progreso.
- `src/server/app/snapshot.ts`: snapshot agregado de `/app`.
- `src/server/auth/`: autenticacion, sesiones y usuarios.
- `src/server/profile.ts`: perfil y reglas de completitud.
- `src/server/profile/actions.ts`: acciones de onboarding.
- `src/server/training/actions.ts`: server actions de entrenamiento.
- `src/server/training/routines.ts`: rutinas y libreria.
- `src/server/training/workouts.ts`: ciclo de vida de workouts.
- `src/server/training/schedule.ts`: agenda semanal.
- `src/server/training/summary.ts`: resumen agregado.
- `src/server/training/progress.ts`: progreso derivado.
- `src/server/training/history.ts`: historial y detalles.
- `src/server/training/running.ts`: running.
- `src/server/db/schema.ts`: esquema completo.
- `docs/FUNCIONAMIENTO_APP.md`: guia funcional y tecnica mas narrativa.

## Referencia rapida de comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check
npm run db:generate
npm run db:studio
npm run db:seed
npm run demo:seed
npm run e2e
docker compose up -d --build
```
