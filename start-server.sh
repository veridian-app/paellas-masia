#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start-server.sh
# Arrancar el backend de Paellas Masía (Redsys API)
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"

echo ""
echo "▶ Paellas Masía — Backend Redsys"
echo "  Directorio: $SERVER_DIR"
echo ""

# Cargar nvm si existe
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
fi

# Comprobar que node está disponible
if ! command -v node &>/dev/null; then
  echo "❌ Error: Node.js no encontrado."
  echo "   Instala Node.js desde https://nodejs.org o activa nvm."
  exit 1
fi

echo "  Node   : $(node --version)"
echo "  npm    : $(npm --version)"
echo ""

cd "$SERVER_DIR"

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias del servidor..."
  npm install
  echo ""
fi

# Comprobar que .env existe
if [ ! -f ".env" ]; then
  echo "⚠️  Archivo .env no encontrado."
  echo "   Copia server/.env.example a server/.env y rellena tus credenciales Redsys."
  exit 1
fi

# Iniciar en modo dev (--watch recarga automáticamente con Node 18+)
echo "🚀 Iniciando servidor en modo desarrollo..."
echo "   Puerto: ${PORT:-3001}"
echo "   (Ctrl+C para parar)"
echo ""
node --watch index.js
