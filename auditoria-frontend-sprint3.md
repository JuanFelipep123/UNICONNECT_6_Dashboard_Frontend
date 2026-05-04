# Auditoría de Código — Frontend · Sprint 3
### Proyecto Uniconnect · Ingeniería de Software III

> **Cómo usar este archivo**
> Desde la raíz de tu repositorio de **frontend** (React + Vite + TS), ejecuta:
> ```bash
> bash <(curl -s https://scrum-toolkit-ucaldas.fly.dev/run-audit-frontend.sh)
> ```
> O descarga el script localmente:
> ```bash
> curl -O https://scrum-toolkit-ucaldas.fly.dev/run-audit-frontend.sh
> bash run-audit-frontend.sh
> ```

---

## Tabla de Criterios (complemento al backend)

| # | Criterio | HU | Pts backend | Pts frontend |
|---|----------|-----|-------------|--------------|
| A | Build sin errores + TypeScript limpio | — | — | 3 |
| B | Decorator en UI (HOC o clase wrapper) | US-06, US-07 | parcial | 4 |
| C | Observer en frontend (eventos, suscripciones) | US-10, US-11 | parcial | 4 |
| D | Flujo E2E del caso más crítico | US-22 | — | 3 |
| E | Calidad de código (TS estricto, sin `any`) | — | — | 2 |
| | **Total** | | | **16** *(escala a 30% junto con backend)* |

> Los puntos de frontend y backend se integran al criterio total de 30 puntos.

---

## Sección A — Build y TypeScript (3 pts)

### A.1 Verificar que el proyecto compila sin errores

```bash
echo "=== BUILD Y TYPESCRIPT ==="

echo "--- TypeScript check (sin emitir archivos) ---"
npx tsc --noEmit 2>&1 | head -30
TSC_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
echo "Errores TS encontrados: $TSC_ERRORS"

echo "--- Build de producción ---"
npm run build 2>&1 | tail -10
BUILD_STATUS=$?
if [ $BUILD_STATUS -eq 0 ]; then
  echo "✓ Build exitoso"
else
  echo "✗ Build falló"
fi

echo "--- Tamaño del bundle ---"
du -sh dist/ 2>/dev/null || echo "No existe carpeta dist/"
```

### A.2 Checklist

- [ ] `npx tsc --noEmit` termina con 0 errores
- [ ] `npm run build` completa sin errores
- [ ] No hay imports de librerías no usadas en los módulos de patrones
- [ ] `tsconfig.json` tiene `strict: true` o equivalente

**Errores TS:** ____  
**Build exitoso:** Sí / No

**Nota del docente (A):** ___ / 3

---

## Sección B — Patrón Decorator en Frontend (4 pts)

En React con TypeScript, el Decorator estructural se implementa como:
- **Higher-Order Component (HOC)**: función que recibe un componente y retorna uno nuevo con comportamiento adicional
- **Wrapper class**: clase que envuelve otra clase (menos común en React pero válido)
- **HOC chain**: múltiples decoradores aplicados en cascada

> **No cuenta** como Decorator: usar el atributo HTML `className`, usar styled-components, o simplemente envolver en un `<div>`.

### B.1 Verificación automática

```bash
echo "=== DECORATOR EN FRONTEND ==="

# HOC pattern: función que recibe y retorna componente
echo "--- Higher-Order Components ---"
grep -rn "function with[A-Z]\|const with[A-Z]\|=> WrappedComponent\|WrappedComponent\b" src/ \
  --include="*.tsx" --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -v "\.spec\.\|\.test\." | head -20

# Decoradores aplicados al perfil (US-07)
echo "--- Decorator en componentes Profile ---"
grep -rn "with\|Decorator\|decorator\|HOC\|hoc\|enhanced\|wrapped" src/ \
  --include="*.tsx" --include="*.ts" \
  \( -path "*profile*" -o -path "*student*" -o -path "*user*" \) \
  --exclude-dir=node_modules 2>/dev/null | head -15

# Decoradores aplicados a mensajes de chat (US-06)
echo "--- Decorator en componentes de Chat ---"
grep -rn "with\|Decorator\|decorator" src/ \
  --include="*.tsx" --include="*.ts" \
  \( -path "*chat*" -o -path "*message*" \) \
  --exclude-dir=node_modules 2>/dev/null | head -15
```

### B.2 Verificar uso correcto del HOC

```bash
echo "--- Patrón HOC: función que recibe componente como parámetro ---"
# Un HOC correcto: const withAuth = (Component: React.ComponentType) => { ... }
grep -rn "ComponentType\|React\.FC\b.*=.*=>" src/ \
  --include="*.tsx" --include="*.ts" \
  --exclude-dir=node_modules 2>/dev/null | grep -v "\.spec\.\|\.test\." | head -20
```

### B.3 Qué debe mostrar el equipo

- [ ] Al menos un HOC que implementa el patrón Decorator (ej: `withAuthentication`, `withStats`, `withPriority`)
- [ ] El HOC **agrega comportamiento** sin modificar el componente base
- [ ] Aplicación en: componente de perfil de estudiante (US-07) Y/O mensajes de chat (US-06)
- [ ] Al menos 2 decoradores aplicables en cadena (`withAuth(withStats(ProfileCard))`)

**Ruta del HOC principal:** `___________________________`
**Cómo se aplica:** `___________________________`

**Nota del docente (B):** ___ / 4

---

## Sección C — Observer en Frontend (4 pts)

En el frontend, el Observer se materializa cuando la UI **reacciona automáticamente** a eventos del backend o internos sin hacer polling.

Implementaciones válidas:
- **WebSockets** (`socket.on(event, handler)`) con gestión de suscripción/desuscripción
- **Custom Event Bus** con `EventEmitter` propio
- **Custom Hook de suscripción** (`useEventListener`, `useSocket`)
- **Zustand / Jotai con suscripciones** si el patrón está explícito

### C.1 Verificación automática

```bash
echo "=== OBSERVER EN FRONTEND ==="

# WebSocket / Socket.io (chat US-10)
echo "--- WebSocket / Socket.io ---"
grep -rn "socket\.on\|socket\.emit\|socket\.off\|io(\|useSocket\|WebSocket(" src/ \
  --include="*.tsx" --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -v "\.spec\.\|\.test\." | head -20

# Custom EventBus o EventEmitter
echo "--- Custom Event Bus ---"
grep -rn "EventEmitter\|EventBus\|\.subscribe(\|\.unsubscribe(\|\.on(\|\.off(" src/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -v "\.spec\.\|\.test\." | head -15

# useEffect como punto de suscripción/desuscripción (React idiomático)
echo "--- useEffect con cleanup (suscripción + desuscripción) ---"
grep -rn "useEffect\|addEventListener\|removeEventListener" src/ \
  --include="*.tsx" \
  --exclude-dir=node_modules 2>/dev/null | grep -v "\.spec\.\|\.test\." | head -20

# US-11: Suscripción a categorías de eventos universitarios
echo "--- Módulo de suscripción a eventos ---"
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) \
  \( -path "*event*" -o -path "*subscription*" -o -path "*notify*" \) \
  --exclude-dir=node_modules 2>/dev/null | head -10
```

### C.2 Verificar manejo correcto del ciclo de vida

```bash
echo "--- Cleanup en useEffect (evitar memory leaks) ---"
# Un Observer correcto limpia la suscripción al desmontar
grep -A10 "useEffect" src/ -r --include="*.tsx" \
  --exclude-dir=node_modules 2>/dev/null \
  | grep -B2 "return () =>" | head -20
```

### C.3 Qué debe mostrar el equipo

- [ ] Los mensajes de chat se actualizan en tiempo real sin recargar la página (US-10)
- [ ] El componente **limpia** la suscripción al desmontarse (`return () => socket.off(...)`)
- [ ] La suscripción a eventos universitarios funciona reactivamente (US-11)
- [ ] No hay polling con `setInterval` como sustituto del Observer

**Ruta del hook/componente Observer:** `___________________________`
**Evento principal observado:** `___________________________`

**Nota del docente (C):** ___ / 4

---

## Sección D — Test E2E (3 pts)

```bash
echo "=== TEST E2E ==="

# Detectar Playwright o Cypress
echo "--- Framework de E2E ---"
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
  echo "Playwright detectado"
  npx playwright test --reporter=list 2>/dev/null | tail -15
elif [ -f "cypress.config.ts" ] || [ -f "cypress.config.js" ]; then
  echo "Cypress detectado"
  npx cypress run --headless 2>/dev/null | tail -15
else
  echo "No se detectó framework E2E configurado"
fi

# Buscar archivos de test E2E
echo "--- Archivos E2E encontrados ---"
find . -name "*.e2e.*" -o -name "*.cy.*" -o -name "*.spec.*" 2>/dev/null \
  | grep -v node_modules | grep -v dist | head -15
```

### D.2 Qué debe mostrar el equipo (US-22)

El test E2E debe cubrir el **flujo más crítico** de la aplicación de forma automatizada desde el navegador real.

- [ ] Test E2E presente y ejecutable (`npm run test:e2e` o `npx playwright test`)
- [ ] Flujo cubierto: login → acceder a dashboard → acción principal (ej: enviar mensaje, ver grupo)
- [ ] El test pasa en la URL de producción
- [ ] Screenshot o video de la ejecución como evidencia

**Flujo crítico cubierto:** `___________________________`
**Resultado del test:** PASS / FAIL

**Nota del docente (D):** ___ / 3

---

## Sección E — Calidad TypeScript (2 pts)

```bash
echo "=== CALIDAD TYPESCRIPT ==="

# Contar usos de 'any' (cada uno resta calidad)
echo "--- Usos de 'any' ---"
ANY_COUNT=$(grep -rn ": any\b\|as any\b" src/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -v "\.spec\.\|\.test\." | wc -l)
echo "Total 'any' encontrados: $ANY_COUNT"
grep -rn ": any\b\|as any\b" src/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=dist \
  2>/dev/null | grep -v "\.spec\.\|\.test\." | head -10

# Verificar tsconfig.json strict mode
echo "--- tsconfig.json strict ---"
grep -A2 '"strict"' tsconfig.json tsconfig.app.json 2>/dev/null

# Linting
echo "--- ESLint ---"
npx eslint src/ --ext .ts,.tsx --max-warnings 10 2>/dev/null \
  | tail -5
```

### E.2 Checklist

- [ ] `strict: true` en `tsconfig.json`
- [ ] Menos de 5 usos de `any` en código de producción (excluye tests)
- [ ] Sin errores de ESLint en los módulos de patrones
- [ ] Interfaces/types definidos para props de todos los componentes de patrones

**Usos de `any`:** ____  
**Errores ESLint:** ____

**Nota del docente (E):** ___ / 2

---

## Resumen Final — Frontend

| Sección | Criterio | Obtenido | Máx |
|---------|----------|----------|-----|
| A | Build + TypeScript | | 3 |
| B | Decorator (HOC/Wrapper) | | 4 |
| C | Observer (tiempo real) | | 4 |
| D | Test E2E | | 3 |
| E | Calidad TypeScript | | 2 |
| | **Total Frontend** | **/16** | 16 |

---

## Nota Consolidada 30% (Backend + Frontend)

| Componente | Puntaje |
|------------|---------|
| Backend (/30) | |
| Frontend (/16) *(peso proporcional)* | |
| **Total sobre 30** | |

> Conversión a nota 5.0: `(Total / 30) × 1.5 = ___`

**Observaciones del docente:**
```
______________________________________________
______________________________________________
```

---
*Generado por Scrum Toolkit · Uniconnect Sprint 3*
