# BildyApp API — Práctica Final Web Servidor

Backend completo para la digitalización de albaranes. API REST con Node.js y Express que gestiona clientes, proyectos y albaranes (horas o materiales), con firma digital, generación de PDF y notificaciones en tiempo real.

**Producción:** https://practicafinalweb-production.up.railway.app  
**Swagger:** https://practicafinalweb-production.up.railway.app/api-docs

---

## Tecnologías

| Categoría | Tecnología |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Base de datos | MongoDB + Mongoose |
| Autenticación | JWT (access + refresh token) |
| Documentación | Swagger/OpenAPI 3.0 |
| Testing | Jest + Supertest + mongodb-memory-server |
| Tiempo real | Socket.IO |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Archivos | Multer + Cloudinary + Sharp |
| PDF | PDFKit |
| Email | Nodemailer (Mailtrap) |
| Monitorización | Slack Incoming Webhooks |
| Bonus PostgreSQL | Prisma + Supabase |

---

## Instalación y ejecución local

### Requisitos previos
- Node.js >= 20.6.0
- Cuenta en MongoDB Atlas
- Cuenta en Cloudinary

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/kur0h3i/practicaFinalWeb.git
cd practicaFinalWeb

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Generar cliente Prisma (bonus PostgreSQL)
npx prisma generate

# 5. Arrancar en modo desarrollo
npm run dev
```

El servidor arranca en `http://localhost:3000`  
Swagger disponible en `http://localhost:3000/api-docs`

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```env
# Servidor
PORT=3000
NODE_ENV=development

# MongoDB (obligatorio)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/bildyapp

# JWT (obligatorio)
JWT_SECRET=cambia_esto
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=cambia_esto_tambien
JWT_REFRESH_EXPIRES_IN=7d

# Archivos
UPLOAD_PATH=uploads
MAX_FILE_SIZE=5242880

# Cloudinary (para firmas y PDFs)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Slack (logging errores 5XX)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# Email — Mailtrap para desarrollo
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=587
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass
MAIL_FROM=noreply@bildyapp.com

# PostgreSQL con Prisma (bonus)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

---

## Ejecución con Docker

```bash
# Levantar la app + MongoDB
docker compose up --build

# En segundo plano
docker compose up --build -d

# Parar
docker compose down
```

La app queda disponible en `http://localhost:3000`.  
No necesitas MongoDB instalado localmente — Docker lo levanta automáticamente.

---

## Tests

```bash
# Ejecutar todos los tests
npm test

# Modo watch
npm run test:watch

# Con informe de cobertura
npm run test:coverage
```

Los tests usan `mongodb-memory-server` — no necesitan conexión a MongoDB Atlas.

**Cobertura actual:** statements 77% · branches 60% · functions 87% · lines 82%

---

## Endpoints

### Usuarios (práctica intermedia)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/user/register` | Registrar usuario | — |
| POST | `/api/user/login` | Iniciar sesión | — |
| POST | `/api/user/refresh` | Renovar token | — |
| PUT | `/api/user/validation` | Verificar email | ✓ |
| PUT | `/api/user/register` | Datos personales | ✓ |
| PATCH | `/api/user/company` | Crear/unirse a compañía | ✓ |
| PATCH | `/api/user/logo` | Subir logo | ✓ |
| GET | `/api/user` | Obtener perfil | ✓ |
| PUT | `/api/user/password` | Cambiar contraseña | ✓ |
| POST | `/api/user/invite` | Invitar usuario (admin) | ✓ |
| POST | `/api/user/logout` | Cerrar sesión | ✓ |
| DELETE | `/api/user` | Eliminar cuenta | ✓ |

### Clientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/client` | Crear cliente |
| GET | `/api/client` | Listar (paginación + filtros) |
| GET | `/api/client/archived` | Listar archivados |
| GET | `/api/client/:id` | Obtener uno |
| PUT | `/api/client/:id` | Actualizar |
| DELETE | `/api/client/:id` | Archivar/eliminar (`?soft=true`) |
| PATCH | `/api/client/:id/restore` | Restaurar archivado |

### Proyectos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/project` | Crear proyecto |
| GET | `/api/project` | Listar (paginación + filtros) |
| GET | `/api/project/archived` | Listar archivados |
| GET | `/api/project/:id` | Obtener uno |
| PUT | `/api/project/:id` | Actualizar |
| DELETE | `/api/project/:id` | Archivar/eliminar (`?soft=true`) |
| PATCH | `/api/project/:id/restore` | Restaurar archivado |

### Albaranes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/deliverynote` | Crear albarán |
| GET | `/api/deliverynote` | Listar (paginación + filtros) |
| GET | `/api/deliverynote/:id` | Obtener uno |
| GET | `/api/deliverynote/pdf/:id` | Descargar PDF |
| PATCH | `/api/deliverynote/:id/sign` | Firmar (sube imagen + genera PDF) |
| DELETE | `/api/deliverynote/:id` | Eliminar (solo si no está firmado) |

### Dashboard (bonus)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard` | Estadísticas con aggregation pipeline |

### PostgreSQL/Prisma (bonus)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/pg/client` | Crear cliente en PostgreSQL |
| GET | `/api/pg/client` | Listar clientes |
| GET | `/api/pg/client/archived` | Listar archivados |
| GET | `/api/pg/client/:id` | Obtener uno |
| PUT | `/api/pg/client/:id` | Actualizar |
| DELETE | `/api/pg/client/:id` | Archivar/eliminar |
| PATCH | `/api/pg/client/:id/restore` | Restaurar |

### Sistema

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado del servidor y base de datos |
| GET | `/api-docs` | Documentación Swagger interactiva |

---

## Estructura del proyecto

```
src/
├── config/
│   ├── index.js           # Configuración centralizada
│   ├── prisma.js          # Cliente Prisma (bonus)
│   └── swagger.js         # Configuración OpenAPI
├── controllers/
│   ├── user.controller.js
│   ├── client.controller.js
│   ├── project.controller.js
│   ├── deliverynote.controller.js
│   ├── dashboard.controller.js
│   └── pg-client.controller.js
├── middleware/
│   ├── auth.middleware.js
│   ├── error-handler.js
│   ├── role.middleware.js
│   ├── upload.js
│   └── validate.js
├── models/
│   ├── User.js
│   ├── Company.js
│   ├── Client.js
│   ├── Project.js
│   └── DeliveryNote.js
├── routes/
│   ├── user.routes.js
│   ├── client.routes.js
│   ├── project.routes.js
│   ├── deliverynote.routes.js
│   ├── dashboard.routes.js
│   └── pg-client.routes.js
├── services/
│   ├── logger.service.js
│   ├── mail.service.js
│   ├── notification.service.js
│   ├── pdf.service.js
│   └── storage.service.js
├── utils/
│   └── AppError.js
├── validators/
│   ├── user.validator.js
│   ├── client.validator.js
│   ├── project.validator.js
│   └── deliverynote.validator.js
├── app.js
└── index.js
tests/
├── setup.js
├── auth.test.js
├── user.test.js
├── client.test.js
├── project.test.js
├── deliverynote.test.js
└── dashboard.test.js
prisma/
└── schema.prisma
```

---

## Características implementadas

- CRUD completo de clientes, proyectos y albaranes
- Paginación y filtros en todos los listados
- Soft-delete y restauración
- Firma digital de albaranes con subida a Cloudinary
- Optimización de imágenes con Sharp (WebP, 800px)
- Generación de PDF con PDFKit y subida a Cloudinary
- Swagger/OpenAPI 3.0 en `/api-docs`
- 61 tests de integración con cobertura ≥70%
- Socket.IO con rooms por compañía (JWT auth)
- Docker multi-stage + docker-compose
- GitHub Actions CI
- Health check en `GET /health`
- Graceful shutdown (SIGTERM/SIGINT)
- Envío de emails con Nodemailer
- Logging de errores 5XX a Slack
- Rate limiting + Helmet + sanitización NoSQL
- **Bonus:** Dashboard con aggregation pipeline (+0.5)
- **Bonus:** PostgreSQL + Prisma + Supabase (+1)
