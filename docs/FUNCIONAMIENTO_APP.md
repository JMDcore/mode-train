# Funcionamiento de Mode Train

Guia funcional y tecnica de la app `mode-train`.

## 1. Objetivo del producto

Mode Train es una PWA mobile-first para entrenamiento personal con dos pilares:

- Gym: rutinas, sesiones, sets, records y progreso.
- Running: planificacion basica, registro de carreras y resumen de rendimiento.

La app esta pensada como espacio privado de un usuario. A dia de hoy no hay roles, equipos ni panel de administracion real.

## 2. Arquitectura general

### Stack

- Frontend + backend: `Next.js App Router`
- UI: React 19 + `motion/react`
- Base de datos: PostgreSQL 16
- ORM: Drizzle
- Auth: sesiones propias almacenadas en DB + cookie HTTP-only

### Capas

- Rutas y layouts: `src/app/`
- Componentes visuales: `src/components/`
- Logica de servidor: `src/server/`
- Esquema de datos: `src/server/db/schema.ts`

### Principio de funcionamiento

La app no guarda "resumenes" materializados. La mayoria de vistas se reconstruyen al vuelo a partir de:

- perfil del usuario
- rutinas y sus ejercicios
- agenda planificada
- sesiones de gym cerradas
- sets registrados
- sesiones de running guardadas

Esto significa que:

- el dashboard (`/app`) es una vista agregada
- historial, resumen y progreso dependen directamente de los registros reales
- si cambian las sesiones o las carreras, cambian tambien los KPIs y cards

## 3. Flujo de acceso

### Entrada inicial

Ruta: `/`

Comportamiento:

- si no hay sesion, redirige a `/login`
- si hay sesion pero el perfil no esta completo, redirige a `/onboarding`
- si el perfil esta completo, redirige a `/app`

### Login

Ruta: `/login`

Archivo principal:

- `src/app/login/page.tsx`
- `src/server/auth/actions.ts`

Funcionamiento:

- valida email y password
- busca usuario por email normalizado
- verifica password con Argon2
- crea una sesion propia en `user_sessions`
- escribe la cookie de sesion y redirige a `/app`

### Registro

Ruta: `/register`

Funcionamiento:

- crea usuario en `app_users`
- crea perfil base en `profiles`
- abre sesion automaticamente
- redirige a onboarding o a `/app` segun el estado del perfil

### Onboarding

Ruta: `/onboarding`

Funcionamiento:

- completa los datos minimos para desbloquear la app
- campos clave:
  - `displayName`
  - `goal`
  - `experienceLevel`
  - `preferredWeeklySessions`
  - `heightCm`
  - `weightKg`

Regla importante:

- un perfil se considera completo si tiene `goal`, `experienceLevel` y `preferredWeeklySessions > 0`

## 4. Shell principal de la app

Ruta: `/app`

Archivo principal:

- `src/components/app-shell/mode-train-app.tsx`

La shell tiene cuatro tabs internos:

- Inicio
- Agenda
- Resumen
- Yo

La ruta no cambia entre tabs. La navegacion se hace por estado en cliente y la data llega ya agregada desde `getAppSnapshot()`.

### Snapshot central

Archivo:

- `src/server/app/snapshot.ts`

El snapshot combina:

- usuario autenticado
- perfil
- agenda semanal
- resumen global
- rutinas del usuario
- workout activo si existe
- contadores de libreria

Es la fuente de verdad de la home y gran parte de la shell.

## 5. Inicio

Tab interna: `home`

Objetivo:

- ofrecer una vista rapida del estado actual del usuario
- destacar la rutina principal o la sesion activa
- concentrar agenda, progreso rapido y accesos de entrada

Elementos clave:

- encabezado con fecha y acceso a rutinas
- bloque hero con arte anatomico segun el foco de la rutina destacada
- KPIs rapidos:
  - sesiones de gym de la semana
  - running del mes
  - numero de rutinas guardadas
- strip semanal con dias y actividad
- bloque principal:
  - si hay sesion abierta, prioriza "Continuar"
  - si no, propone entrenar la rutina destacada
- resumen corto de semana y rutinas activas

Dependencias principales:

- `snapshot.activeWorkoutSummary`
- `snapshot.focusMetrics`
- `snapshot.schedule`
- `snapshot.routines`

## 6. Agenda

Tab interna: `agenda`

Objetivo:

- planificar gym y running
- registrar actividad hecha
- abrir rapido una rutina planificada

### Vista principal

La agenda trabaja siempre sobre una semana y un dia activo.

Muestra:

- rango de semana
- selector de dia
- conteo de planificados y completados
- lista de eventos del dia

Cada entrada puede ser:

- `gym`
- `running`

### Composer de agenda

La parte inferior del tab cambia entre cuatro modos:

- `plan-gym`
- `plan-running`
- `log-gym`
- `log-running`

Acciones que soporta:

- crear una entrada planificada de gym
- crear una entrada planificada de running
- iniciar o registrar gym
- guardar una carrera hecha

### Reglas importantes

- una entrada planificada no es lo mismo que una sesion completada
- el conteo de completados de la semana se deriva de `workout_sessions` cerradas y `running_sessions`, no de una marca manual sobre la agenda
- si una entrada de gym tiene `routineTemplateId`, se puede abrir directamente desde la agenda

Archivos clave:

- `src/server/training/schedule.ts`
- `src/server/training/actions.ts`

## 7. Resumen

Tab interna: `summary`

Objetivo:

- visualizar mezcla de actividad
- consultar records de gym
- ver indicadores de running

Tiene tres modos:

- `general`
- `body`
- `running`

Y tres scopes:

- `week`
- `month`
- `total`

### General

Muestra:

- balance entre gym, running y rutinas
- metricas agregadas de gym y running
- actividad reciente enlazable al detalle

### Body

Muestra:

- foco anatomico segun records
- lista de mejores marcas por ejercicio
- selector de ejercicio para ver la mejor serie

### Running

Muestra:

- distancia mas larga
- mejores ritmos 1k / 5k / 10k
- cards agregadas de running y agenda

Archivos clave:

- `src/server/training/summary.ts`
- `src/server/training/focus.ts`

## 8. Yo

Tab interna: `profile`

Objetivo:

- resumen rapido del usuario
- accesos a mantenimiento de perfil y rutinas

Muestra:

- nombre, objetivo y nivel
- metricas basicas:
  - altura
  - peso
  - numero de rutinas
  - tamano del pool
- resumen de semana y mes
- accesos a:
  - editar perfil (`/onboarding`)
  - rutinas y ejercicios (`/app/routines`)
  - cerrar sesion (`/logout`)

## 9. Hub de rutinas

Ruta: `/app/routines`

Archivo principal:

- `src/components/training/routines-hub.tsx`
- `src/server/training/routines.ts`

Objetivo:

- gestionar las plantillas de entrenamiento
- revisar el pool de ejercicios
- crear rutinas y ejercicios custom

### Vistas internas

- `routines`: lista de rutinas del usuario
- `pool`: biblioteca total de ejercicios

### Acciones soportadas

- crear una rutina nueva
- abrir una rutina para editar
- lanzar un entreno desde una rutina
- crear ejercicios propios

### Datos que expone

- numero de items por rutina
- fecha mas reciente planificada para cada rutina
- foco visual inferido o manual
- conteo de ejercicios del sistema y custom

## 10. Editor de rutina

Ruta: `/app/routines/[routineId]`

Archivo principal:

- `src/components/training/routine-editor.tsx`

Objetivo:

- editar una plantilla concreta

Permite:

- cambiar el foco visual de la rutina
- anadir ejercicios desde la libreria
- editar objetivos por ejercicio:
  - sets
  - rango de reps
  - RIR
  - descanso
  - notas
- reordenar bloques
- eliminar bloques

Reglas importantes:

- una rutina vacia no puede iniciarse
- el orden se normaliza para evitar huecos en `sortOrder`

## 11. Sesion de gym

Ruta: `/app/workouts/[sessionId]`

Archivo principal:

- `src/components/training/workout-session.tsx`
- `src/server/training/workouts.ts`

Objetivo:

- registrar la ejecucion de una rutina

### Comportamiento

- una sesion pertenece a una rutina y una fecha `performedOn`
- cada ejercicio se guarda por bloques de sets
- al guardar un bloque, se reemplaza el bloque previo de ese ejercicio para esa sesion
- la vista muestra ultimo rendimiento conocido del ejercicio

### Reglas de negocio

- solo puede haber una sesion abierta por usuario
- si el usuario intenta abrir otra rutina con una sesion abierta distinta, el backend lo bloquea
- una sesion no se puede cerrar sin al menos un set guardado
- una sesion cerrada sigue siendo editable desde la misma vista/detalle

### Estados posibles

- abierta
- cerrada
- cancelada/eliminada

## 12. Historial

Ruta: `/app/history`

Objetivo:

- concentrar la actividad pasada del usuario

Agrupa:

- workouts cerrados
- carreras guardadas

Cada fila se ordena por fecha efectiva y enlaza a:

- `/app/history/workouts/[sessionId]`
- `/app/history/runs/[runId]`

### Detalle de workout

Muestra:

- rutina
- fecha
- duracion
- volumen
- ejercicios y sets guardados

### Detalle de run

Muestra:

- tipo de salida
- fecha
- distancia
- duracion
- ritmo medio
- notas

Archivos clave:

- `src/server/training/history.ts`
- `src/server/training/running.ts`

## 13. Progreso

Ruta: `/app/progress`

Objetivo:

- sintetizar el progreso por ejercicio y el volumen reciente

Muestra:

- resumen de sesiones, sets, volumen y runs
- cards por ejercicio con:
  - ultima marca
  - mejor marca
  - tendencia vs bloque anterior
- milestones generados a partir de esas cards

Importante:

- el progreso se deriva de workouts cerrados
- no existe una tabla dedicada a "records"

Archivo clave:

- `src/server/training/progress.ts`

## 14. Modelo de datos principal

Tablas mas importantes:

- `app_users`: identidad base y password hash
- `profiles`: datos del usuario y onboarding
- `user_sessions`: sesiones persistidas
- `exercise_categories`: categorias de ejercicios
- `exercises`: ejercicios del sistema y custom
- `routine_templates`: plantillas de rutina
- `routine_template_items`: ejercicios dentro de una rutina
- `weekly_plan_entries`: plan semanal base por dia
- `training_schedule_entries`: agenda explicita por fecha
- `workout_sessions`: sesiones de gym
- `workout_sets`: sets guardados en una sesion
- `running_sessions`: carreras registradas
- `progress_photos`: estructura preparada para fotos de progreso
- `friendships`: estructura social futura
- `notifications`: estructura de avisos futura

## 15. Scripts y datos de soporte

### Seed base del sistema

Comando:

```bash
npm run db:seed
```

Inserta:

- categorias base
- ejercicios de sistema

### Seed de cuenta demo

Comando:

```bash
npm run demo:seed
```

Crea o refresca una cuenta demo completa con:

- perfil finalizado
- rutinas
- agenda
- historial de gym
- carreras
- progreso
- sesion abierta

### Smokes

Hay smokes independientes para validar areas concretas:

- auth
- starter week
- editor de rutinas
- lifecycle de workout
- historial y progreso
- agenda y resumen
- running

## 16. Estado funcional actual y limites conocidos

### Lo que ya funciona bien

- autenticacion por email + password
- onboarding con guardado real
- dashboard principal
- agenda semanal y planificacion
- creacion y edicion de rutinas
- libreria de ejercicios del sistema y custom
- apertura, guardado y cierre de sesiones de gym
- historial de gym y running
- resumen y progreso derivados

### Lo que existe pero no esta completamente expuesto

- `createStarterWeek()` existe en backend y en tests, pero no es hoy la accion principal de la home
- `notifications` existe en schema, pero el icono de campana es visual y aun no abre una bandeja funcional
- hay base para social (`friendships`), pero no hay flujo de producto terminado
- no existe rol admin ni permisos especiales por usuario

## 17. Mapa rapido de archivos importantes

- `src/app/app/page.tsx`: entrada protegida a la shell principal
- `src/components/app-shell/mode-train-app.tsx`: shell, tabs y dashboard
- `src/components/training/routines-hub.tsx`: hub de rutinas y pool
- `src/components/training/routine-editor.tsx`: editor de rutina
- `src/components/training/workout-session.tsx`: sesion de gym
- `src/components/training/history-overview.tsx`: historial agregado
- `src/components/training/progress-overview.tsx`: progreso detallado
- `src/server/app/snapshot.ts`: snapshot agregado del dashboard
- `src/server/training/actions.ts`: server actions de la app
- `src/server/training/workouts.ts`: lifecycle de sesiones de gym
- `src/server/training/schedule.ts`: agenda semanal
- `src/server/training/summary.ts`: resumen agregado
- `src/server/training/progress.ts`: progreso derivado
- `src/server/db/schema.ts`: esquema completo de datos
