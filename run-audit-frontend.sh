#!/usr/bin/env bash
# ============================================================
# Auditoría Automática de Frontend — Sprint 3
# Proyecto Uniconnect · Ingeniería de Software III — React + Vite + TS
# ============================================================
# Uso: bash run-audit-frontend.sh [URL_FRONTEND]

# No usamos set -e para que los fallos se documenten sin abortar el script
set -uo pipefail 2>/dev/null || true

FRONTEND_URL="${1:-}"
REPORT_FILE="audit-report-frontend.txt"
PASS=0; FAIL=0; WARN=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

check()   { echo -e "${GREEN}  ✓ PASS${RESET} $1"; ((PASS++));  echo "PASS | $1" >> "$REPORT_FILE"; }
fail()    { echo -e "${RED}  ✗ FAIL${RESET} $1"; ((FAIL++));  echo "FAIL | $1" >> "$REPORT_FILE"; }
warn()    { echo -e "${YELLOW}  ⚠ WARN${RESET} $1"; ((WARN++));  echo "WARN | $1" >> "$REPORT_FILE"; }
section() { echo -e "\n${CYAN}${BOLD}══ $1 ══${RESET}"; echo "" >> "$REPORT_FILE"; echo "=== $1 ===" >> "$REPORT_FILE"; }

echo "AUDITORÍA FRONTEND — Sprint 3 — $(date)" > "$REPORT_FILE"
echo "Directorio: $(pwd)" >> "$REPORT_FILE"
echo "============================================" >> "$REPORT_FILE"
echo -e "${BOLD}Auditoría Frontend · Sprint 3 · $(date '+%d/%m/%Y %H:%M')${RESET}"

# ── Verificar proyecto ────────────────────────────────────────
section "Estructura del proyecto"

[ -f "vite.config.ts" ] || [ -f "vite.config.js" ] \
  && check "Vite configurado" \
  || fail "No se encontró vite.config.ts — ¿es un proyecto Vite?"

[ -f "tsconfig.json" ] || [ -f "tsconfig.app.json" ] \
  && check "TypeScript configurado" \
  || fail "No se encontró tsconfig.json"

[ -f "package.json" ] \
  && check "package.json presente" \
  || fail "package.json no encontrado"

SRC_DIR="src"; [ ! -d "src" ] && warn "Carpeta src/ no encontrada"

# ── BUILD Y TYPESCRIPT ────────────────────────────────────────
section "A — Build y TypeScript"

echo "  Ejecutando TypeScript check..."
TSC_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
[ "$TSC_ERRORS" -eq 0 ] \
  && check "TypeScript sin errores" \
  || fail "TypeScript: $TSC_ERRORS error(s) encontrados"
echo "  Errores TS: $TSC_ERRORS" >> "$REPORT_FILE"

echo "  Ejecutando build de producción..."
BUILD_LOG=$(mktemp 2>/dev/null || echo "/tmp/vite_build_$$.log")
if npm run build > "$BUILD_LOG" 2>&1; then
  check "Build de producción exitoso"
  BUNDLE_SIZE=$(du -sh dist/ 2>/dev/null | cut -f1 || echo "N/A")
  echo "  Tamaño del bundle: $BUNDLE_SIZE"
else
  fail "Build falló — revisa errores en la consola"
  tail -15 "$BUILD_LOG" 2>/dev/null || true
fi
rm -f "$BUILD_LOG" 2>/dev/null || true

# strict mode en tsconfig
STRICT=$(grep '"strict"' tsconfig.json tsconfig.app.json 2>/dev/null | grep -v "false" | wc -l || true)
[ "$STRICT" -gt 0 ] \
  && check "strict: true en tsconfig" \
  || warn "strict mode no detectado en tsconfig"

# ── DECORATOR EN FRONTEND ─────────────────────────────────────
section "B — Patrón Decorator (HOC)"

# Buscar Higher-Order Components
HOC_WITH=$(grep -rn "^const with[A-Z]\|^export.*with[A-Z]\|^function with[A-Z]" "$SRC_DIR/" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | wc -l || true)

HOC_WRAPPED=$(grep -rn "WrappedComponent\|ComponentType\|React\.ComponentType" "$SRC_DIR/" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -v "\.spec\.\|\.test\." | wc -l || true)

HOC_CHAIN=$(grep -rn "with[A-Z].*(with[A-Z]" "$SRC_DIR/" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | wc -l || true)

# Detector alternativo: clase que envuelve componente
DECORATOR_CLASS=$(grep -rn "class.*Decorator\b" "$SRC_DIR/" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules 2>/dev/null | grep -v "\.spec\.\|\.test\." | wc -l || true)

echo "  HOCs (with...): $HOC_WITH"
echo "  Uso de ComponentType/WrappedComponent: $HOC_WRAPPED"
echo "  Cadenas de HOC: $HOC_CHAIN"
echo "  Clases Decorator: $DECORATOR_CLASS"

{ [ "$HOC_WITH" -gt 0 ] || [ "$HOC_WRAPPED" -gt 0 ] || [ "$DECORATOR_CLASS" -gt 0 ]; } \
  && check "Decorator/HOC detectado en frontend" \
  || fail "No se encontró patrón Decorator (HOC o clase wrapper) en frontend"

# Buscar aplicación en módulos de perfil y chat
PROFILE_HOC=$(grep -rn "with[A-Z]" "$SRC_DIR/" \
  --include="*.tsx" \
  \( -path "*profile*" -o -path "*student*" -o -path "*user*" \) \
  --exclude-dir=node_modules 2>/dev/null | wc -l || true)
CHAT_HOC=$(grep -rn "with[A-Z]" "$SRC_DIR/" \
  --include="*.tsx" \
  \( -path "*chat*" -o -path "*message*" \) \
  --exclude-dir=node_modules 2>/dev/null | wc -l || true)

[ "$PROFILE_HOC" -gt 0 ] && check "HOC aplicado en módulo Profile/Student" \
  || warn "No se detectó Decorator en módulo de perfil (US-07)"
[ "$CHAT_HOC" -gt 0 ] && check "HOC aplicado en módulo Chat" \
  || warn "No se detectó Decorator en módulo de chat (US-06)"

grep -rn "const with[A-Z]\|function with[A-Z]\|WrappedComponent" "$SRC_DIR/" \
  --include="*.tsx" --include="*.ts" \
  --exclude-dir=node_modules 2>/dev/null \
  | grep -v "\.spec\.\|\.test\." >> "$REPORT_FILE" || true

# ── OBSERVER EN FRONTEND ──────────────────────────────────────
section "C — Observer (WebSocket / EventBus)"

# WebSocket / Socket.io
SOCKET_ON=$(grep -rn "socket\.on\|socket\.off\|useSocket\|socket\.subscribe" "$SRC_DIR/" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -v "\.spec\.\|\.test\." | wc -l || true)

# Custom EventEmitter
EVENT_BUS=$(grep -rn "EventEmitter\|EventBus\|eventBus\|\.subscribe(\|\.unsubscribe(" "$SRC_DIR/" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -v "\.spec\.\|\.test\." | wc -l || true)

# useEffect con cleanup (patrón React para suscripciones)
CLEANUP=$(grep -rn "return () =>" "$SRC_DIR/" \
  --include="*.tsx" \
  --exclude-dir=node_modules 2>/dev/null | grep -v "\.spec\.\|\.test\." | wc -l || true)

# Custom hooks de suscripción
CUSTOM_HOOKS=$(grep -rn "^export.*function use[A-Z].*subscribe\|^export.*function use[A-Z].*socket\|^export.*function use[A-Z].*event" "$SRC_DIR/" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | wc -l || true)

echo "  Socket.on / Socket.off: $SOCKET_ON"
echo "  EventEmitter / EventBus: $EVENT_BUS"
echo "  useEffect con cleanup: $CLEANUP"
echo "  Custom hooks de suscripción: $CUSTOM_HOOKS"

{ [ "$SOCKET_ON" -gt 0 ] || [ "$EVENT_BUS" -gt 0 ] || [ "$CUSTOM_HOOKS" -gt 0 ]; } \
  && check "Observer/suscripción en tiempo real detectado" \
  || fail "No se detectó patrón Observer/WebSocket en frontend"

[ "$CLEANUP" -gt 0 ] \
  && check "Cleanup en useEffect detectado ($CLEANUP instancias) — evita memory leaks" \
  || warn "Sin cleanup en useEffect — verificar que no haya memory leaks"

# Buscar en módulos relevantes
for MODULE in chat event notification subscription; do
  SOCKET_IN_MOD=$(grep -rn "socket\.on\|\.subscribe\|EventEmitter" "$SRC_DIR/" \
    --include="*.tsx" --include="*.ts" \
    \( -path "*$MODULE*" \) \
    --exclude-dir=node_modules 2>/dev/null | wc -l || true)
  [ "$SOCKET_IN_MOD" -gt 0 ] && check "Observer en módulo '$MODULE' ($SOCKET_IN_MOD refs)"
done

# ── E2E ───────────────────────────────────────────────────────
section "D — Test E2E"

PLAYWRIGHT_CFG=""
CYPRESS_CFG=""
[ -f "playwright.config.ts" ] && PLAYWRIGHT_CFG="playwright.config.ts"
[ -f "playwright.config.js" ] && PLAYWRIGHT_CFG="playwright.config.js"
[ -f "cypress.config.ts" ] && CYPRESS_CFG="cypress.config.ts"
[ -f "cypress.config.js" ] && CYPRESS_CFG="cypress.config.js"

E2E_FILES=$(find . -name "*.e2e.*" -o -name "*.cy.*" 2>/dev/null \
  | grep -v node_modules | grep -v dist | wc -l || true)

if [ -n "$PLAYWRIGHT_CFG" ]; then
  check "Playwright configurado ($PLAYWRIGHT_CFG)"
  echo "  Ejecutando Playwright..."
  PLAYWRIGHT_OUT=$(npx playwright test --reporter=list 2>/dev/null || true)
  if echo "$PLAYWRIGHT_OUT" | grep -q "passed\|failed"; then
    PLAYWRIGHT_PASSED=$(echo "$PLAYWRIGHT_OUT" | grep -c "passed" || true)
    [ "$PLAYWRIGHT_PASSED" -gt 0 ] && check "Tests E2E pasan" || fail "Tests E2E fallan"
  else
    warn "No se pudo ejecutar Playwright — verifica la configuración"
  fi
elif [ -n "$CYPRESS_CFG" ]; then
  check "Cypress configurado ($CYPRESS_CFG)"
  warn "Ejecuta manualmente: npx cypress run --headless"
else
  fail "No se detectó framework E2E (Playwright o Cypress)"
fi

[ "$E2E_FILES" -gt 0 ] \
  && check "$E2E_FILES archivos E2E encontrados" \
  || fail "No se encontraron archivos de test E2E"

# URL E2E
if [ -n "$FRONTEND_URL" ]; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$FRONTEND_URL" 2>/dev/null || echo "000")
  { [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ]; } \
    && check "Frontend accesible en: $FRONTEND_URL (HTTP $HTTP_STATUS)" \
    || fail "Frontend no responde: $FRONTEND_URL (HTTP $HTTP_STATUS)"
else
  warn "URL de frontend no proporcionada — ejecuta: bash run-audit-frontend.sh https://tu-app.fly.dev"
fi

# ── CALIDAD TS ────────────────────────────────────────────────
section "E — Calidad TypeScript"

ANY_COUNT=$(grep -rn ": any\b\| as any\b" "$SRC_DIR/" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -v "\.spec\.\|\.test\." | wc -l || true)
echo "  Usos de 'any': $ANY_COUNT"
echo "  Usos de 'any': $ANY_COUNT" >> "$REPORT_FILE"
[ "$ANY_COUNT" -le 5 ] \
  && check "Uso de 'any' controlado ($ANY_COUNT)" \
  || warn "Demasiados 'any' ($ANY_COUNT) — reduce a menos de 5 en código de producción"

# ESLint
if [ -f ".eslintrc*" ] || [ -f "eslint.config*" ]; then
  ESLINT_ERRORS=$(npx eslint "$SRC_DIR/" --ext .ts,.tsx 2>/dev/null | grep -c "error" || true)
  [ "$ESLINT_ERRORS" -le 5 ] \
    && check "ESLint: $ESLINT_ERRORS error(s)" \
    || fail "ESLint: $ESLINT_ERRORS errores — corrige antes de la auditoría"
else
  warn "ESLint no configurado"
fi

# ── RESUMEN ───────────────────────────────────────────────────
section "Resumen"
echo -e "\n${BOLD}Resultados:${RESET}"
echo -e "  ${GREEN}PASS: $PASS${RESET} | ${RED}FAIL: $FAIL${RESET} | ${YELLOW}WARN: $WARN${RESET}"

SCORE=0
[ "$FAIL" -eq 0 ] && SCORE=16
[ "$FAIL" -eq 1 ] && SCORE=13
[ "$FAIL" -eq 2 ] && SCORE=10
[ "$FAIL" -eq 3 ] && SCORE=7
[ "$FAIL" -gt 3 ] && SCORE=4

echo "" >> "$REPORT_FILE"
echo "RESUMEN: PASS=$PASS | FAIL=$FAIL | WARN=$WARN" >> "$REPORT_FILE"
echo "Estimación frontend: $SCORE / 16" >> "$REPORT_FILE"

echo -e "${BOLD}Estimación frontend (referencial): $SCORE / 16${RESET}"
echo -e "\nReporte guardado en: ${CYAN}$REPORT_FILE${RESET}"

# Salir con código 1 solo si hay FAILs (para compatibilidad con CI)
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
