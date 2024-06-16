import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';




chromium.use(StealthPlugin());

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
    });
    const page = await context.newPage();

    console.log("Testing the stealth plugin..");
    await page.goto("https://steamdb.info/app/730/charts/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000)
    await page.screenshot({ path: "screenshot.png", fullPage: true });
    console.log("All done, check the screenshot. ✨");
    await browser.close();
})();

function saveData(filename: string, data: any) {
    if (!existsSync(resolve(__dirname, 'data'))) {
        mkdirSync('data');
    }
    writeFile(resolve(__dirname, `data/${filename}.json`), JSON.stringify(data), {
        encoding: 'utf8',
    });
}
