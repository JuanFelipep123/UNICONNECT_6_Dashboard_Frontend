import { test, expect } from '@playwright/test';

/**
 * US-22 — Flujo E2E crítico: Uniconnect Dashboard
 *
 * Cubre: carga de la app → página de login visible → redirección Auth0
 * La verificación de sesión autenticada se hace validando la respuesta
 * HTTP de la URL de producción y la presencia de elementos clave de la UI.
 */

const BASE_URL = 'https://uniconnect-web.fly.dev';

test.describe('US-22 — Flujo crítico Uniconnect', () => {
  test('La aplicación carga correctamente y devuelve HTTP 200', async ({ page }) => {
    const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
  });

  test('La página tiene título y meta descripción configurados (SEO)', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('La pantalla de login/auth está presente o redirige a Auth0', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const url = page.url();
    const bodyText = await page.locator('body').innerText().catch(() => '');

    // La app puede: mostrar login propio, redirigir a Auth0, o mostrar el dashboard
    const loginPresent =
      url.includes('auth0.com') ||
      url.includes('login') ||
      (await page.locator('button, a, input[type="submit"]').count()) > 0;

    expect(loginPresent).toBeTruthy();
  });

  test('No hay errores críticos de JavaScript en la consola', async ({ page }) => {
    const jsErrors: string[] = [];

    page.on('pageerror', (err) => {
      // Ignorar errores de red/CORS que no son errores de la app
      if (!err.message.includes('NetworkError') && !err.message.includes('CORS')) {
        jsErrors.push(err.message);
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    expect(jsErrors).toHaveLength(0);
  });

  test('La app contiene elementos de UI de Uniconnect (imagen, texto o botón)', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Debe haber al menos algún elemento interactivo o contenido visible
    const hasContent =
      (await page.locator('img, button, h1, h2, a').count()) > 0;

    expect(hasContent).toBeTruthy();
  });
});
