import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.ULOMIS_BASE_URL ?? "http://127.0.0.1:4173";
const input = [
  "Current status: We completed the diagnostic and the learner is comfortable with fractions.",
  "We decided to focus the next session on algebra word problems.",
  "We are still waiting for the parent to confirm Thursday's time.",
  "Next I need to send two practice questions before the session.",
].join("\n");

const devices = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-320", width: 320, height: 700 },
];

await mkdir("proof/browser", { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const device of devices) {
    const page = await browser.newPage({ viewport: { width: device.width, height: device.height } });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto(`${baseUrl}/?start=real-thread&utm_source=github-proof`, {
      waitUntil: "networkidle",
    });

    await page.locator("#real-thread-content").fill(input);
    await page.locator("#real-thread-label").fill("Next student session");
    await page.getByRole("button", { name: "Restore my thread locally" }).click();

    await page.getByText("Your first continuity packet", { exact: true }).waitFor();
    await page.getByText("We decided to focus the next session on algebra word problems.", { exact: true }).waitFor();
    await page.getByText("We are still waiting for the parent to confirm Thursday's time.", { exact: true }).waitFor();
    await page.getByText("Next I need to send two practice questions before the session.", { exact: true }).waitFor();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const events = await page.evaluate(() => window.ulomisEvents ?? []);
    const firstValueEvent = events.find((entry) => entry.event === "real_thread_first_value_completed");

    if (overflow) throw new Error(`${device.name}: horizontal overflow detected`);
    if (!firstValueEvent) throw new Error(`${device.name}: real_thread_first_value_completed was not emitted`);
    if (consoleErrors.length) throw new Error(`${device.name}: console/page errors: ${consoleErrors.join(" | ")}`);

    await page.screenshot({
      path: `proof/browser/${device.name}.png`,
      fullPage: true,
    });

    results.push({
      viewport: `${device.width}x${device.height}`,
      continuityPacketVisible: true,
      decisionVisible: true,
      openLoopVisible: true,
      nextActionVisible: true,
      horizontalOverflow: false,
      firstValueEvent: firstValueEvent.event,
      eventProps: firstValueEvent.props ?? {},
    });

    await page.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  "proof/browser/results.json",
  `${JSON.stringify({ checkedAt: new Date().toISOString(), baseUrl, input, results }, null, 2)}\n`,
);

console.log(JSON.stringify(results, null, 2));
