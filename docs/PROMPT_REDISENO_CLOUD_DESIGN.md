# Prompt para redisenar Mode Train con Cloud Design / Cloud Code

Copia este prompt completo y pasaselo a Cloud Design o Cloud Code cuando quieras generar una propuesta de rediseno visual integral para Mode Train.

```text
Quiero que hagas un rediseno visual completo de Mode Train sin perder ninguna funcionalidad existente.

Mode Train es una PWA mobile-first de entrenamiento personal privado. La app permite registrar y planificar entrenamiento de fuerza, running, rutinas, sesiones, historial y progreso. No es una landing page ni una app de marketing: debe sentirse como una herramienta diaria de alta calidad, rapida y clara para entrenar desde el movil.

Objetivo del rediseno:
- Mantener todos los flujos funcionales actuales.
- Mejorar drasticamente la percepcion visual, jerarquia, legibilidad y ergonomia movil.
- Proponer una direccion visual excelente desde cero, justificada por el uso diario de la app.
- Explorar criterio de producto, no seguir literalmente la estetica actual.
- Preparar recursos visuales, componentes, tokens y referencias suficientes para implementar un rework total en codigo.

Restricciones importantes:
- No cambiar la funcionalidad de producto.
- No eliminar rutas, acciones, campos ni estados actuales.
- No convertir la app en una landing.
- No introducir UI kits genericos.
- No usar colores hardcodeados sin proponer tokens.
- La app debe seguir siendo mobile-first.
- La interfaz debe poder implementarse con CSS global, tokens y componentes React existentes.
- Usar iconografia estilo lucide-react.
- Mantener una experiencia de una mano: controles claros, tactiles y con buena separacion.

Contexto tecnico:
- Next.js App Router.
- React.
- PWA mobile-first.
- CSS global con tokens en `src/app/globals.css`.
- Componentes principales en:
  - `src/components/app-shell/`
  - `src/components/auth/`
  - `src/components/onboarding/`
  - `src/components/training/`
- Tipografias actuales:
  - Sora para headings y momentos de producto.
  - Manrope para interfaz.
  - JetBrains Mono para datos.
- Iconos actuales: lucide-react.

Direccion visual a proponer:
- No asumas que la direccion actual es la correcta.
- Propon 2 o 3 rutas visuales distintas antes de elegir una.
- Para cada ruta, explica:
  - concepto
  - paleta
  - estilo de componentes
  - nivel de energia visual
  - ventajas
  - riesgos
  - por que encaja o no con una app diaria de entrenamiento
- Despues elige la ruta mas fuerte y desarrolla el sistema completo.
- La decision debe priorizar calidad de producto, claridad, accionabilidad y deseo de uso diario.
- Puede ser oscura, clara, mixta, editorial, tecnica, deportiva, minimalista o expresiva si lo justificas bien.
- Evita copiar la estetica actual salvo que argumentes claramente que merece conservarse.
- Evita resultados genericos de fitness, SaaS dashboard o landing startup.

Sistema visual a definir:
- Paleta completa con tokens y razonamiento.
- Capas de superficie y jerarquia visual.
- Acentos por categorias si aportan claridad:
  - fuerza/gym
  - running
  - progreso
  - agenda
- Estados claros:
  - activo
  - planificado
  - completado
  - bloqueado
  - error
  - exito
  - vacio
- Botones con jerarquia clara:
  - accion primaria unica por bloque
  - acciones secundarias
  - acciones ghost o destructivas discretas
- Formularios apilados y legibles en movil.
- Cards densas, escaneables y con bordes/radios moderados.
- Navegacion inferior fija y tactil.
- Motion system: define cuando usar animacion, con que intensidad y que debe evitarse.

Necesito que propongas el rediseno de las siguientes vistas y estados.

1. Login
Vista: `/login`
Debe incluir:
- Identidad clara de Mode Train.
- Formulario de email y contrasena.
- CTA principal para entrar.
- Acceso secundario a registro.
- Estados de error visibles pero elegantes.
- Sensacion de privacidad y seguridad.
Evitar:
- Hero enorme.
- Copy excesivo.
- Ilustraciones genericas de gimnasio.

2. Registro
Vista: `/register`
Debe incluir:
- Nombre.
- Email.
- Contrasena.
- CTA principal para crear cuenta.
- Acceso secundario a login.
- Confirmacion visual de que el usuario esta creando un espacio privado.
Debe mantener:
- Flujo hacia onboarding.

3. Onboarding / Perfil inicial
Vista: `/onboarding`
Debe incluir:
- Nombre visible.
- Objetivo.
- Nivel de experiencia.
- Sesiones por semana.
- Altura.
- Peso.
- CTA para entrar en la app.
Necesito:
- Diseno tipo setup guiado, claro y rapido.
- Opciones de objetivo y nivel con seleccion tactil.
- Resumen visual pequeno de lo elegido.
- Buen estado para editar perfil posteriormente desde "Yo".

4. Shell principal
Vista: `/app`
Tabs internas:
- Inicio.
- Agenda.
- Resumen.
- Yo.
Debe incluir:
- Header compacto con fecha, identidad y acciones.
- Navegacion inferior fija.
- Cuerpo scrollable sin romper viewport movil.
- Estados de carga/vacio pensados.
- Notificacion de sesion completada o cancelada.

5. Inicio
Tab: Inicio
Objetivo:
- Mostrar rapidamente que toca hoy, estado de semana y accion principal.
Debe incluir:
- Saludo compacto.
- Fecha.
- Hero funcional, no decorativo.
- Rutina destacada o sesion activa.
- CTA para continuar/iniciar entreno.
- KPIs rapidos:
  - gym semana
  - running mes
  - rutinas guardadas
- Strip semanal con dias, planificados y completados.
- Accesos a rutinas, historial y progreso si encajan.
- Estado vacio cuando no hay rutinas.
Necesito:
- Variante con sesion activa.
- Variante sin rutinas.
- Variante con rutina planificada hoy.

6. Agenda
Tab: Agenda
Objetivo:
- Planificar y registrar actividad.
Debe incluir:
- Selector semanal.
- Dias de la semana con indicadores.
- Dia activo.
- Lista de eventos del dia.
- Estados para gym y running.
- Acciones:
  - planificar gym
  - planificar running
  - registrar gym
  - registrar running
  - borrar entrada planificada
  - iniciar rutina planificada
Necesito:
- Diseno del composer inferior o panel de accion.
- Formularios cortos, apilados y tactiles.
- Diferenciar claramente "planificado" de "completado".
- Variante de dia vacio.
- Variante de varios eventos.

7. Resumen
Tab: Resumen
Modos:
- General.
- Body.
- Running.
Scopes:
- semana.
- mes.
- total.
Debe incluir:
- Selector de modo.
- Selector de periodo.
- Cards de metricas.
- Actividad reciente enlazable.
- Records de fuerza.
- Records y ritmos de running.
- Visual corporal o grafico de foco si aporta claridad.
Necesito:
- Diseno de cards compactas.
- Grafico o visual simple de distribucion gym/running.
- Estado sin datos.
- Jerarquia para que los mejores datos destaquen sin saturar.

8. Yo / Perfil
Tab: Yo
Debe incluir:
- Nombre, iniciales/avatar y email si aplica.
- Objetivo y nivel.
- Altura, peso, sesiones semanales.
- Resumen de semana y mes.
- Accesos a:
  - editar perfil
  - rutinas y ejercicios
  - cerrar sesion
Debe sentirse:
- Privado.
- Claro.
- Como panel personal, no red social publica.

9. Hub de rutinas
Vista: `/app/routines`
Debe incluir:
- Lista de rutinas.
- Crear rutina.
- Biblioteca/pool de ejercicios.
- Crear ejercicio custom.
- Conteo de ejercicios sistema/custom.
- Foco visual de cada rutina.
- CTA para entrenar una rutina.
- Acceso al editor.
Necesito:
- Dos vistas internas o tabs: Rutinas y Pool.
- Cards de rutina escaneables.
- Empty state de primera rutina.
- Buen layout movil para formularios.

10. Editor de rutina
Vista: `/app/routines/[routineId]`
Debe incluir:
- Nombre de rutina.
- Foco visual seleccionable.
- Lista ordenada de ejercicios.
- Agregar ejercicio desde libreria.
- Por cada ejercicio:
  - sets objetivo
  - reps min/max
  - RIR
  - descanso
  - notas
  - mover arriba/abajo
  - eliminar
- CTA para volver y/o iniciar si procede.
Necesito:
- Cards de ejercicio muy claras.
- Inputs numericos faciles en movil.
- Estados de rutina vacia.
- Tratamiento visual para foco muscular.

11. Sesion de gym
Vista: `/app/workouts/[sessionId]`
Objetivo:
- Registrar entrenamiento en directo.
Debe incluir:
- Header de sesion con rutina, fecha y estado.
- Lista de ejercicios.
- Para cada ejercicio:
  - ultimo rendimiento conocido.
  - sets actuales.
  - inputs para peso, reps y RIR.
  - boton guardar bloque.
- CTA para completar sesion.
- Accion para cancelar sesion.
- Estado de sesion cerrada.
Necesito:
- Diseno usable durante el entrenamiento, con dedos cansados.
- Numeros grandes donde tenga sentido.
- Inputs estables que no rompan layout.
- Feedback claro al guardar un bloque.
- Diferenciar ejercicios pendientes y guardados.

12. Historial
Vista: `/app/history`
Debe incluir:
- Lista cronologica de workouts y runs.
- Diferenciar tipo de actividad con iconos y color/acento.
- Resumen por item:
  - fecha
  - nombre/rutina o tipo de carrera
  - volumen o distancia
  - duracion si aplica
- Link a detalle.
Necesito:
- Estado sin historial.
- Agrupacion por fecha o bloques temporales si mejora lectura.

13. Detalle de workout
Vista: `/app/history/workouts/[sessionId]`
Debe incluir:
- Rutina.
- Fecha.
- Duracion.
- Volumen.
- Ejercicios.
- Sets registrados.
- Notas.
Necesito:
- Lectura clara y cuidada de entrenamiento completado.
- Tabla/lista de sets legible en movil.

14. Detalle de running
Vista: `/app/history/runs/[runId]`
Debe incluir:
- Tipo de salida.
- Fecha.
- Distancia.
- Duracion.
- Ritmo medio.
- Notas.
- Posibilidad de editar si la funcionalidad existe.
Necesito:
- Card de metricas de carrera.
- Jerarquia clara para distancia y pace.

15. Progreso
Vista: `/app/progress`
Debe incluir:
- Resumen de sesiones, sets, volumen y runs.
- Cards por ejercicio:
  - ultima marca
  - mejor marca
  - tendencia
  - grupo muscular
- Milestones.
- Visuales compactos tipo chart si aportan.
Necesito:
- Estado sin datos.
- Diseno que parezca analitica personal, no dashboard empresarial pesado.

16. Recursos visuales necesarios
Genera o especifica:
- Paleta de tokens propuesta.
- Tipografia y escala.
- Radios, sombras, bordes y espaciado.
- Componentes base:
  - app shell
  - tabbar
  - header
  - cards
  - metric cards
  - routine cards
  - exercise cards
  - forms
  - buttons
  - segmented controls
  - empty states
  - toast/status messages
- Iconografia recomendada usando lucide-react.
- Sistema de estados.
- Referencias de imagen/arte si se necesitan.
- Mockups mobile-first de cada vista.
- Si haces desktop, que sea adaptacion secundaria.

17. Entregables que necesito recibir
Quiero que me devuelvas:
- Una propuesta de direccion visual general.
- Un sistema de diseno con tokens.
- Una lista de componentes y variantes.
- Un desglose pantalla por pantalla.
- Mockups o descripcion visual detallada de cada pantalla.
- Notas de implementacion para mantener funcionalidad.
- Riesgos a evitar durante implementacion.
- Assets necesarios, con nombres sugeridos y uso previsto.

18. Criterios de aceptacion
El rediseno sera bueno si:
- La app se entiende en menos de 5 segundos al abrir `/app`.
- La accion principal de cada vista es obvia.
- La navegacion movil es clara y fija.
- Los datos densos se pueden leer de un vistazo.
- Los formularios son comodos en movil.
- No se pierde ninguna accion existente.
- El resultado se puede implementar sobre el proyecto actual sin reescribir toda la arquitectura.
- La estetica se siente cuidada, distintiva, privada y orientada a entrenamiento real.

Importante:
Devuelveme una propuesta pensada para que otro agente pueda implementarla despues en el codigo actual. No quiero solo inspiracion visual; quiero especificaciones accionables, componentes, estados, prioridades y recursos.
```
