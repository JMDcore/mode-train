import { expect, test, type Page } from "@playwright/test";

async function registerAndOnboard(page: Page, suffix: string) {
  const email = `playwright+${suffix}@mode-train.local`;
  const password = `ModeTrain!${suffix}`;

  await page.goto("/register");
  await page.getByLabel("Nombre").fill(`PW ${suffix}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByLabel("Objetivo").selectOption("Ser mas fuerte");
  await page.getByLabel("Nivel").selectOption("Intermedio");
  await page.getByLabel("Sesiones / semana").fill("3");
  await page.getByLabel("Altura (cm)").fill("178");
  await page.getByLabel("Peso (kg)").fill("78.5");
  await page.getByRole("button", { name: "Entrar en la app" }).click();

  await expect(page).toHaveURL(/\/app$/);

  return { email, password };
}

async function createStarterWeek(page: Page) {
  await page.getByRole("button", { name: "Crear semana" }).click();
  await expect(page.getByRole("button", { name: "Ver plan" })).toBeVisible();
}

test("registro, onboarding y semana inicial", async ({ page }) => {
  await registerAndOnboard(page, `${Date.now()}`);

  await createStarterWeek(page);

  await page.getByRole("button", { name: "Entrena" }).click();
  await expect(page.getByText("Rutinas")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Empuje/ })).toBeVisible();
});

test("editar rutina, guardar sets y cerrar sesion", async ({ page }) => {
  await registerAndOnboard(page, `${Date.now()}-flow`);

  await createStarterWeek(page);

  await page.getByRole("button", { name: "Entrena" }).click();
  await expect(page.getByText("Rutinas")).toBeVisible();

  await page.getByRole("link", { name: "Editar" }).first().click();
  await expect(page).toHaveURL(/\/app\/routines\//);

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

  await page.getByRole("button", { name: "Entrena" }).click();
  await page.getByRole("button", { name: "Iniciar" }).first().click();
  await expect(page).toHaveURL(/\/app\/workouts\//);

  const firstSessionCard = page.locator(".session-card").first();
  const trackedExercise = await firstSessionCard.getByRole("heading").textContent();

  if (!trackedExercise) {
    throw new Error("No se ha podido identificar el ejercicio editado.");
  }

  await firstSessionCard.locator('input[type="number"]').nth(0).fill("100");
  await firstSessionCard.locator('input[type="number"]').nth(1).fill("5");
  await firstSessionCard.locator('input[type="number"]').nth(2).fill("2");
  await firstSessionCard.getByRole("button", { name: "Guardar bloque" }).click();
  await expect(firstSessionCard.getByText("1 guardados")).toBeVisible();

  await page.getByRole("button", { name: "Completar sesion" }).click();
  await expect(page).toHaveURL(/\/app\?success=workout-completed$/);
  await expect(page.getByText("Sesion completada y guardada.")).toBeVisible();
  await expect(page.getByText("Actividad")).toBeVisible();

  await page.getByRole("link", { name: "Historial", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/history$/);
  await expect(page.getByText("Actividad reciente")).toBeVisible();

  await page.goto("/app?success=workout-completed");
  await page.getByRole("link", { name: "Progreso", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/progress$/);
  await expect(page.getByText("Ejercicios vivos", { exact: true })).toBeVisible();
});
