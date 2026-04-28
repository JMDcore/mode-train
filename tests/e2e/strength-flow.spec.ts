import { expect, test, type Page } from "@playwright/test";

async function registerAndOnboard(page: Page, suffix: string) {
  const email = `playwright+${suffix}@mode-train.local`;
  const password = `ModeTrain!${suffix}`;
  const displayName = `PW ${suffix}`;

  await page.goto("/register");
  await page.getByLabel("Nombre").fill(displayName);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByLabel("Nombre").fill(displayName);
  await page.getByText("Ser mas fuerte", { exact: true }).click();
  await page.getByText("Intermedio", { exact: true }).click();
  await page.getByLabel("Sesiones / semana").fill("3");
  await page.getByLabel("Altura (cm)").fill("178");
  await page.getByLabel("Peso (kg)").fill("78.5");
  await page.getByRole("button", { name: /Entrar en/i }).click();

  await expect(page).toHaveURL(/\/app$/);

  return { email, password };
}

async function createRoutine(page: Page, name: string) {
  await page.goto("/app/routines");
  await page.locator('input[name="name"]').fill(name);
  await page.getByRole("button", { name: "Crear rutina" }).click();
  await expect(page).toHaveURL(/\/app\/routines\/.+$/);
}

test("registro, onboarding y acceso al hub de rutinas", async ({ page }) => {
  await registerAndOnboard(page, `${Date.now()}`);

  await expect(page.getByText("Base pendiente")).toBeVisible();

  await page.getByRole("link", { name: "Ver rutinas" }).click();
  await expect(page).toHaveURL(/\/app\/routines$/);
  await expect(page.getByRole("heading", { name: "Nueva rutina" })).toBeVisible();
});

test("la shell principal queda fija al viewport en movil", async ({ page }) => {
  await registerAndOnboard(page, `${Date.now()}-shell`);

  const shellMetrics = await page.evaluate(() => {
    const footer = document.querySelector(".app-footer");
    const screenBody = document.querySelector(".screen-body");

    return {
      docScrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
      footerTop: footer?.getBoundingClientRect().top ?? null,
      screenBodyClientHeight: screenBody?.clientHeight ?? 0,
      screenBodyScrollHeight: screenBody?.scrollHeight ?? 0,
    };
  });

  expect(shellMetrics.docScrollHeight).toBeLessThanOrEqual(shellMetrics.innerHeight + 1);
  expect(shellMetrics.hasHorizontalOverflow).toBeFalsy();
  expect(shellMetrics.screenBodyScrollHeight).toBeGreaterThan(shellMetrics.screenBodyClientHeight);

  await page.locator(".screen-body").evaluate((node) => {
    node.scrollBy({ top: 800, behavior: "instant" });
  });

  const afterScrollMetrics = await page.evaluate(() => {
    const footer = document.querySelector(".app-footer");
    const screenBody = document.querySelector(".screen-body");

    return {
      footerTop: footer?.getBoundingClientRect().top ?? null,
      screenBodyScrollTop: screenBody?.scrollTop ?? 0,
    };
  });

  expect(afterScrollMetrics.screenBodyScrollTop).toBeGreaterThan(0);
  expect(Math.abs((afterScrollMetrics.footerTop ?? 0) - (shellMetrics.footerTop ?? 0))).toBeLessThan(1);
});

test("crear rutina, guardar sets y completar sesion", async ({ page }) => {
  await registerAndOnboard(page, `${Date.now()}-flow`);
  const routineName = `Empuje ${Date.now()}`;

  await createRoutine(page, routineName);

  const exerciseSelect = page.locator('select[name="exerciseId"]');
  const firstOptionValue = await exerciseSelect.locator("option").first().getAttribute("value");

  if (!firstOptionValue) {
    throw new Error("El editor no ha cargado ejercicios disponibles.");
  }

  await exerciseSelect.selectOption(firstOptionValue);
  await page.getByRole("button", { name: "Anadir a la rutina" }).click();
  await expect(page.getByText("Ejercicio anadido.")).toBeVisible();

  await page.getByRole("link", { name: "Volver" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await expect(page.getByRole("heading", { name: routineName })).toBeVisible();
  await page.goto("/app/routines");
  await page.getByRole("button", { name: "Entrenar" }).first().click();
  await expect(page).toHaveURL(/\/app\/workouts\//);

  const firstSessionCard = page.locator(".session-card").first();

  await firstSessionCard.locator('input[type="number"]').nth(0).fill("100");
  await firstSessionCard.locator('input[type="number"]').nth(1).fill("5");
  await firstSessionCard.locator('input[type="number"]').nth(2).fill("2");
  await firstSessionCard.getByRole("button", { name: "Guardar bloque" }).click();
  await expect(firstSessionCard.getByText("1 guardados")).toBeVisible();

  await page.getByRole("button", { name: "Completar sesion" }).click();
  await expect(page).toHaveURL(/\/app\?success=workout-completed$/);
  await expect(page.getByText("Sesion completada y guardada.")).toBeVisible();
  await expect(page.getByRole("heading", { name: routineName })).toBeVisible();
});
