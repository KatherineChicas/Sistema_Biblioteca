# Sistema Biblioteca – Grupo 4

Aplicación web (SPA) para la gestión de una biblioteca universitaria: catálogo, préstamos,
devoluciones con multas, ventas/rentas, informes y administración del sistema.

**Stack:** React 19 · Vite 8 · React Router 7 · Tailwind CSS 4 · Zustand 5 · Recharts · jsPDF

## Cómo ejecutar

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # build de producción en dist/
```

## Usuarios de prueba

| Rol           | Correo                  | Contraseña |
|---------------|-------------------------|------------|
| Administrador | admin@biblioteca.edu    | admin123   |
| Bibliotecario | harold@biblioteca.edu   | harold123  |
| Usuario       | diego@unitec.edu        | diego123   |

## Arquitectura

```
src/
├── pages/        Capa de presentación (una página por módulo)
├── components/   Layout y componentes de UI reutilizables (Modal, Table, Button, Toaster…)
├── context/      AuthContext: sesión y control de acceso por rol
├── store/        useLibraryStore: lógica de negocio + persistencia (Zustand + localStorage)
├── utils/        reportPdf: generación del informe en PDF
└── data/         Datos semilla de demostración
```

Las páginas no modifican datos directamente: llaman acciones del store
(`createLoan`, `registerReturn`, `payFine`, `purchase`, `saveBook`, `saveUser`, `updateSettings`…),
que validan las reglas de negocio y registran cada operación en la bitácora de auditoría.

## Novedades de la versión 2

- Estado global con Zustand y persistencia en `localStorage` (los datos ya no se pierden al recargar).
- Rutas nuevas: `/users`, `/fines`, `/settings`, `/sales`, `/my-loans` (antes eran enlaces rotos).
- Préstamos reales: descuentan inventario, validan suspensión, multas pendientes, máximo de préstamos y libro repetido. Detalle y renovación.
- Devoluciones que calculan días de atraso con la fecha real, generan la multa y actualizan inventario.
- Módulo de Multas con registro de pagos.
- Catálogo con compra/renta funcional y alta/edición de libros con validaciones.
- Registro de cuenta y restablecimiento de contraseña desde el login.
- Exportación real del informe a PDF.
- Administración completa: usuarios, auditoría y respaldo/restauración en JSON.
- Configuración global de tarifas y plazos.
- Notificaciones de vencimientos, contadores dinámicos en el menú, búsqueda global y mensajes emergentes de confirmación.

## Trabajo pendiente

- Backend real (API REST + base de datos) que reemplace la persistencia local.
- Autenticación con contraseñas cifradas y envío real de correos de recuperación.
