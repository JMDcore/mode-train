## Mode Train

Base de la nueva app de entrenamiento social privada.

Estado actual:
- `Next.js 16.2.2`
- `React 19.2.4`
- `Motion` para animaciones
- `PostgreSQL 16` en Docker
- `Drizzle` como base de modelado
- `PWA` mobile-first

### Stack

- Frontend + backend: `Next.js App Router`
- Runtime de contenedor: `Node 24`
- Base de datos: `PostgreSQL 16`
- Hash de password previsto: `@node-rs/argon2`
- Motion: `motion`

### Comandos

Desarrollo:

```bash
npm run dev
```

Calidad:

```bash
npm run lint
npm run typecheck
npm run build
npm run check
```

Drizzle:

```bash
npm run db:generate
npm run db:studio
```

Docker stack local / Raspberry:

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

### Healthcheck

- App: `GET /api/health`
- Dev local: `http://localhost:3000/api/health`

### Estructura

- `src/app/`: rutas App Router y manifest PWA
- `src/components/`: componentes visuales
- `src/server/db/`: cliente y esquema base
- `Dockerfile`: imagen de producción con `output: standalone`
- `docker-compose.yml`: stack `app + db` para Raspberry Pi

### Notas

- El nombre técnico actual es `mode-train`.
- El dominio objetivo actual es `train.jmdcore.com`.
- La base visual actual es una primera dirección premium oscura/morada desde la que construiremos el producto real.
