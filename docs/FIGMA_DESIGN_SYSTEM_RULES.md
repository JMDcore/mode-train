# Mode Train — Reglas Para Figma

## Estado actual
- Cuenta Figma conectada: `jmdcore.dev@gmail.com`
- Equipo visible: `El equipo de Jose Miguel Díaz`
- Permiso detectado en esta sesión: `View`

Esto significa que puedo preparar reglas, documentación y handoff desde el código, pero para editar o generar diseño final dentro de un archivo Figma compartido necesitaremos acceso de edición.

## 1. Tokens de diseño

### Fuente de verdad actual
Los tokens viven en [globals.css](/opt/stacks/mode-train/src/app/globals.css) como variables CSS dentro de `:root`.

```css
:root {
  --background: #06050b;
  --foreground: #f6f3ff;
  --text-soft: rgba(207, 197, 230, 0.76);
  --surface: rgba(13, 11, 22, 0.86);
  --line: rgba(255, 255, 255, 0.08);
  --accent: #8d4bff;
  --accent-2: #d5bfff;
}
```

### Regla Figma
- Crear variables para `background`, `surface`, `line`, `text`, `accent`.
- Mantener una sola dirección visual: `dark / premium / violet accent`.
- No introducir una segunda paleta ni light mode en esta fase.
- Usar nombres de variables cercanos al código para facilitar el handoff.

## 2. Librería de componentes

### Fuente de verdad actual
Los componentes UI están repartidos por feature en [src/components](/opt/stacks/mode-train/src/components).

Piezas principales:
- Shell principal: [mode-train-app.tsx](/opt/stacks/mode-train/src/components/app-shell/mode-train-app.tsx)
- Auth: [auth-card.tsx](/opt/stacks/mode-train/src/components/auth/auth-card.tsx)
- Onboarding: [onboarding-card.tsx](/opt/stacks/mode-train/src/components/onboarding/onboarding-card.tsx)
- Fuerza: [routine-editor.tsx](/opt/stacks/mode-train/src/components/training/routine-editor.tsx)
- Sesión: [workout-session.tsx](/opt/stacks/mode-train/src/components/training/workout-session.tsx)
- Historial: [history-overview.tsx](/opt/stacks/mode-train/src/components/training/history-overview.tsx)
- Progreso: [progress-overview.tsx](/opt/stacks/mode-train/src/components/training/progress-overview.tsx)

### Regla Figma
- Construir componentes base antes de diseñar pantallas:
  - `Top Bar`
  - `Bottom Tab Bar`
  - `Surface Card`
  - `Stat Card`
  - `Action Button`
  - `Ghost Button`
  - `List Row`
  - `Workout Card`
  - `Metric Badge`
  - `Form Field`
- Diseñar variantes por estado, no por pantalla.
- Evitar componentes muy específicos acoplados a una sola vista.

## 3. Framework y stack

- Framework principal: `Next.js App Router`
- UI: `React 19`
- Lenguaje: `TypeScript`
- Animación: `motion`
- Iconos: `lucide-react`
- Persistencia: `PostgreSQL + Drizzle`

### Regla Figma
- Diseñar pensando en una PWA mobile-first.
- Anchura de referencia recomendada para frames:
  - `390`
  - `430`
- Evitar patrones puramente nativos iOS o Android si no aportan claridad.

## 4. Assets

### Estado actual
- No hay una librería visual de assets compleja todavía.
- Los iconos son vectoriales desde `lucide-react`.
- Las fotos de progreso y avatares van a persistir en volumen de storage, no en el repo.

### Regla Figma
- Mantener iconografía lineal y consistente con Lucide.
- No usar ilustraciones genéricas ni fondos recargados.
- Si se usan imágenes, deben apoyar progreso o branding, no decorar por decorar.

## 5. Sistema de iconos

### Fuente de verdad actual
Los iconos se importan directamente desde `lucide-react`.

Ejemplo en [mode-train-app.tsx](/opt/stacks/mode-train/src/components/app-shell/mode-train-app.tsx):

```tsx
import { Dumbbell, History, TrendingUp, User } from "lucide-react";
```

### Regla Figma
- Usar trazos limpios, geométricos y ligeros.
- No mezclar iconos sólidos con lineales.
- Mantener pesos visuales parecidos a Lucide.

## 6. Enfoque de estilos

### Estado actual
- Estilo centralizado en un único archivo global: [globals.css](/opt/stacks/mode-train/src/app/globals.css)
- Sin CSS modules ni styled-components.
- Componentes con clases semánticas por bloque.

### Regla Figma
- Reflejar esta misma jerarquía:
  - `foundation`
  - `component`
  - `screen`
- No diseñar spacing “a ojo”: usar una escala consistente.
- Radios grandes, superficies suaves, bordes finos, contraste controlado.

## 7. Estructura de proyecto

### Organización actual
- Rutas App Router: [src/app](/opt/stacks/mode-train/src/app)
- Componentes por dominio: [src/components](/opt/stacks/mode-train/src/components)
- Lógica server-side: [src/server](/opt/stacks/mode-train/src/server)
- Scripts de smoke: [scripts](/opt/stacks/mode-train/scripts)
- E2E: [tests/e2e](/opt/stacks/mode-train/tests/e2e)

### Regla Figma
- Mapear páginas 1:1 con rutas reales:
  - `/login`
  - `/register`
  - `/onboarding`
  - `/app`
  - `/app/routines/[routineId]`
  - `/app/workouts/[sessionId]`
  - `/app/history`
  - `/app/history/workouts/[sessionId]`
  - `/app/progress`

## 8. Dirección visual para el rediseño

### Mantener
- base oscura
- acento morado
- sensación premium y limpia
- motion fluido y sobrio

### Cambiar
- menos densidad de texto por pantalla
- más jerarquía visual y respiración
- navegación más clara
- mayor consistencia entre cards, formularios y vistas detalle

## 9. Reglas de motion

La referencia real de motion está en el código con `motion/react`.

### Regla Figma
- Usar pocas transiciones, pero con intención.
- Priorizar:
  - entrada por opacidad + desplazamiento corto
  - transiciones de layout
  - feedback de estados y selección
- Evitar animaciones largas, rebotonas o decorativas.

## 10. Orden de trabajo recomendado en Figma

1. `Foundations`
2. `Core components`
3. `Navigation`
4. `Dashboard`
5. `Workout session`
6. `Routine editor`
7. `History`
8. `Progress`

## 11. Qué necesito para entrar de lleno en Figma

- Acceso `Edit` a un archivo o equipo de Figma
- Idealmente un archivo vacío para:
  - `Foundations`
  - `Components`
  - `App screens`

En cuanto eso exista, el siguiente bloque natural es levantar el sistema visual y luego rediseñar la shell y las pantallas clave con una dirección ya profesional y coherente.
