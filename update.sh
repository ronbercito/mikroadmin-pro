#!/usr/bin/env bash
# MikroAdmin Pro - Script de actualización para Debian 12
# Actualiza una instalación existente con los últimos cambios del repo de GitHub
set -e

APP_DIR="/opt/mikroadmin"
FRONTEND_DIR="/var/www/mikroadmin"
REPO_URL="https://github.com/ronbercito/mikroadmin-pro.git"
TMP_DIR="/tmp/mikroadmin-update"

echo "=== MikroAdmin Pro - Actualización ==="
echo "Verificando instalación previa..."

if [ ! -d "$APP_DIR/backend" ] || [ ! -d "$APP_DIR/frontend" ]; then
  echo "ERROR: No se encontró instalación previa en $APP_DIR"
  echo "Ejecuta install.sh primero para una instalación nueva."
  exit 1
fi

echo "[1/6] Descargando última versión del repo..."
rm -rf "$TMP_DIR"
git clone --depth 1 "$REPO_URL" "$TMP_DIR"

echo "[2/6] Respaldando configuración..."
# Respaldar .env del backend (tiene credenciales de BD y JWT)
cp "$APP_DIR/backend/.env" "$TMP_DIR/backend/.env" 2>/dev/null || true
# Respaldar .env del frontend
cp "$APP_DIR/frontend/.env" "$TMP_DIR/frontend/.env" 2>/dev/null || true

echo "[3/6] Actualizando backend..."
cp -r "$TMP_DIR/backend/"* "$APP_DIR/backend/"
cd "$APP_DIR/backend"
npm install --omit=dev
npx prisma generate
npx prisma db push
echo "  → Esquema de base de datos actualizado."

echo "[4/6] Reconstruyendo frontend..."
cp -r "$TMP_DIR/frontend/"* "$APP_DIR/frontend/"
cd "$APP_DIR/frontend"
npm install
npm run build

echo "[5/6] Desplegando frontend..."
rm -rf "$FRONTEND_DIR"
mkdir -p "$FRONTEND_DIR"
cp -r dist/* "$FRONTEND_DIR/"

echo "[6/6] Reiniciando servicios..."
pm2 restart mikroadmin-api --update-env
pm2 save
systemctl reload nginx

# Limpieza
rm -rf "$TMP_DIR"

echo "========================================"
echo " Actualización completada."
echo " Panel:  http://$(hostname -I | awk '{print $1}')/admin"
echo "========================================"
