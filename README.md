# MikroAdmin Pro — Versión auto-alojable (Debian 12)

Panel de administración para ISP con gestión de clientes y sincronización directa con routers MikroTik. Esta versión corre 100% en tu propio servidor Debian, sin depender de Base44.

## Stack
- **Backend:** Node.js 20 + Express + Prisma ORM
- **Base de datos:** MariaDB 10 (compatible MySQL)
- **Auth:** JWT + bcrypt
- **MikroTik:** Cliente REST API RouterOS v7.1+
- **Tareas:** node-cron (corte automático por impago, diario a las 02:00)
- **Frontend:** React 18 + Vite + Tailwind CSS + lucide-react
- **Servidor:** Nginx + PM2

## Instalación (Debian 12 limpio)

1. Copia la carpeta `selfhosted/` a tu servidor:
   ```bash
   scp -r selfhosted/ root@tu-servidor:/root/mikroadmin
   ```
2. En el servidor, ejecuta el instalador:
   ```bash
   cd /root/mikroadmin
   chmod +x install.sh
   ./install.sh
   ```
   El script instala Node, MariaDB, Nginx, PM2; crea la base de datos; genera `.env`; aplica el esquema; crea el usuario admin; construye el frontend y configura Nginx + PM2.

3. Al terminar verás la URL del panel y las credenciales admin:
   - **Admin por defecto:** `admin@mikroadmin.local` / `admin123` (cámbialas en la BD después).

4. (Opcional) HTTPS con tu dominio:
   ```bash
   apt-get install -y certbot python3-certbot-nginx
   certbot --nginx -d panel.tudominio.com
   ```

## Estructura
```
selfhosted/
  install.sh              # Instalador para Debian
  backend/                # API Node + Express + Prisma
    prisma/schema.prisma  # Esquema MariaDB
    src/lib/mikrotik.js   # Cliente REST MikroTik
    src/routes/           # auth, routers, clients, billing, sync, cutoff
    src/jobs/cron.js      # Corte automático
  frontend/               # React + Vite + Tailwind
    src/pages/            # Login, Dashboard, Routers, Clients, Ajustes...
```

## Comandos útiles (en el servidor)
```bash
pm2 status                      # estado del backend
pm2 logs mikroadmin-api         # logs
cd /opt/mikroadmin/backend && npx prisma studio   # explorar BD
systemctl restart nginx
```

## Sincronización con la versión Base44
No hay sincronización automática: la app Base44 y esta versión auto-alojada son dos codebases independientes. Están construidas para **mirrored** (mismas entidades, misma UI, misma lógica), de modo que cualquier cambio hecho en una se traslada manualmente a la otra:
- Cambios de **entidades/esquema** → actualiza `prisma/schema.prisma`.
- Cambios de **UI** → actualiza el archivo equivalente en `frontend/src/pages/`.
- Cambios de **lógica MikroTik/corte** → actualiza `backend/src/lib/mikrotik.js` y `routes/`.

## Configurar MikroTik REST API
En cada router (RouterOS v7.1+):
- Habilita `www-ssl` o `www` con la API REST.
- Crea un usuario API con permisos de `write` + `read`.
- Registra el router en el panel (Gestión de Red → Routers) con host, puerto (443/80), usuario y contraseña.