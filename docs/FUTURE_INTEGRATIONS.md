# Integraciones Pendientes

## Google Calendar

Estado: pendiente para una fase futura, fuera de v1.

Motivo:
- primero queremos un calendario interno robusto, rapido y claro;
- la planificacion debe funcionar perfecta sin depender de terceros;
- una vez estabilizada la UX, se puede estudiar sincronizacion bidireccional.

Objetivo futuro:
- exportar entrenos planificados de gym y running a Google Calendar;
- opcionalmente importar eventos relevantes;
- resolver conflictos de edicion entre Mode Train y Google Calendar.

Requisitos previos antes de empezar:
- calendario interno con fechas reales y multiples eventos por dia;
- modelo de datos estable para eventos de gym y running;
- estado de completado y edicion posterior de entrenos bien resuelto;
- estrategia clara de permisos OAuth y refresco de tokens.

Notas de producto:
- la sincronizacion no debe reemplazar el calendario interno;
- la agenda de Mode Train sigue siendo la fuente de verdad del entrenamiento;
- Google Calendar sera una capa de conveniencia, no la base del sistema.
