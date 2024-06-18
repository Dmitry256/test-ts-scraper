import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { extractTableContent, GAME_URL, getTableSourceFromPage } from "./utils"

const DATA_FILENAME = "gameData.json";
const DATA_DIRNAME = "storage";

chromium.use(StealthPlugin());

async function fetchGameData(url: string) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'America/New_York',
    });
    const page = await context.newPage();
    console.log("Parsing game data with stealth plugin..");
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000)
    const tableSource = await getTableSourceFromPage(page);
    if (tableSource) {
        const extractedTableContent = extractTableContent(tableSource);
        await saveData(DATA_FILENAME, extractedTableContent);
        await displayFileContent();
        console.log(`All done, check the file: ${DATA_DIRNAME}/${DATA_FILENAME}. ✨`);
    } else {
        console.warn('Table not found, try one more time')
    };
    await browser.close();
};

async function saveData(filename: string, data: any) {
    if (!existsSync(resolve(__dirname, DATA_DIRNAME))) {
        mkdirSync(DATA_DIRNAME);
    }
    await writeFile(resolve(__dirname, `${DATA_DIRNAME}/${filename}`), JSON.stringify(data, null, 2), {
        encoding: 'utf8',
    });
};

async function displayFileContent() {
    console.log(await readFile(
        resolve(__dirname, `${DATA_DIRNAME}/${DATA_FILENAME}`),
        { encoding: 'utf8' },
    )
    )
};
fetchGameData(GAME_URL);