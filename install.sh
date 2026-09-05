#!/usr/bin/env bash
# MikroAdmin Pro - Instalador para Debian 12 (limpio)
set -e

APP_DIR="/opt/mikroadmin"
FRONTEND_DIR="/var/www/mikroadmin"
DB_NAME="mikroadmin"
DB_USER="mikroadmin"
DB_PASS="mk_$(openssl rand -hex 10)"
JWT_SECRET="$(openssl rand -hex 32)"
JWT_REFRESH="$(openssl rand -hex 32)"
ADMIN_EMAIL="admin@mikroadmin.local"
ADMIN_PASSWORD="admin123"
SERVER_NAME="_"   # Cámbialo por tu dominio, ej: panel.misp.com

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== MikroAdmin Pro - Instalación en Debian ==="
export DEBIAN_FRONTEND=noninteractive

echo "[1/8] Sistema: Node 20, MariaDB, Nginx, PM2..."
apt-get update -y
apt-get install -y curl ca-certificates gnupg2 lsb-release openssl build-essential nginx mariadb-server
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2

echo "[2/8] Copiando proyecto a $APP_DIR..."
mkdir -p "$APP_DIR"
cp -r "$SCRIPT_DIR/backend" "$APP_DIR/"
cp -r "$SCRIPT_DIR/frontend" "$APP_DIR/"

echo "[3/8] Base de datos MariaDB..."
systemctl enable --now mariadb
mariadb -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mariadb -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mariadb -e "GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost'; FLUSH PRIVILEGES;"

echo "[4/8] Backend: dependencias, esquema y admin..."
cat > "$APP_DIR/backend/.env" <<EOF
DATABASE_URL="mysql://$DB_USER:$DB_PASS@localhost:3306/$DB_NAME"
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="8h"
JWT_REFRESH_SECRET="$JWT_REFRESH"
JWT_REFRESH_EXPIRES_IN="7d"
CRON_CUTOFF="0 2 * * *"
PORT=4000
ADMIN_EMAIL="$ADMIN_EMAIL"
ADMIN_PASSWORD="$ADMIN_PASSWORD"
EOF
cd "$APP_DIR/backend"
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js

echo "[5/8] Frontend: build..."
cd "$APP_DIR/frontend"
echo "VITE_API_URL=/api" > .env
npm install
npm run build
rm -rf "$FRONTEND_DIR"
mkdir -p "$FRONTEND_DIR"
cp -r dist/* "$FRONTEND_DIR/"

echo "[6/8] PM2..."
cat > "$APP_DIR/ecosystem.config.cjs" <<EOF
module.exports = {
  apps: [{
    name: 'mikroadmin-api',
    cwd: '$APP_DIR/backend',
    script: 'src/server.js',
    env: { NODE_ENV: 'production' },
    instances: 1,
    autorestart: true,
  }]
};
EOF
pm2 start "$APP_DIR/ecosystem.config.cjs" || pm2 restart mikroadmin-api
pm2 save
pm2 startup systemd -y >/dev/null 2>&1 || true

echo "[7/8] Nginx..."
cat > /etc/nginx/sites-available/mikroadmin <<EOF
server {
  listen 80;
  server_name $SERVER_NAME;
  root $FRONTEND_DIR;
  index index.html;
  location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
  }
  location / { try_files \$uri \$uri/ /index.html; }
}
EOF
ln -sf /etc/nginx/sites-available/mikroadmin /etc/nginx/sites-enabled/mikroadmin
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "[8/8] Listo."
IP="$(hostname -I | awk '{print $1}')"
echo "----------------------------------------"
echo " Panel:  http://$IP"
echo " Admin:  $ADMIN_EMAIL / $ADMIN_PASSWORD"
echo " Notas:  - Edita SERVER_NAME en install.sh y vuelve a correr para tu dominio."
echo "         - HTTPS: apt-get install certbot && certbot --nginx -d tu-dominio"
echo "----------------------------------------"