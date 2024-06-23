import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { extractTableContent, GAME_URL, getTableSourceFromPage } from "./utils"

const DATA_FILENAME = "gameDataFromStealth.json";
const DATA_DIRNAME = "storage";
const ROOT_DIR = resolve(__dirname, "..");
const MAX_RETRIES = 3;
const RETRY_TIMEOUT_INCREMENT = 5000;

chromium.use(StealthPlugin());

async function fetchGameData(url: string) {
  let attempts = 0;
  let tableFound = false;
  let timeout = 0;

  const browser = await chromium.launch({ headless: true });

  while (attempts < MAX_RETRIES && !tableFound) {
    timeout += RETRY_TIMEOUT_INCREMENT * attempts
    attempts++;
    console.log(`Attempt ${attempts} to fetch and parse game data...`);
    const page = await browser.newPage();

    console.log("Parsing game data with stealth plugin..");
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
    } catch(error) {
      console.error('Error:', error);
    };
    await page.waitForTimeout(timeout);

    const tableSource = await getTableSourceFromPage(page);

    if (tableSource) {
      tableFound = true;

      const extractedTableContent = extractTableContent(tableSource);
      await saveData(DATA_FILENAME, extractedTableContent);
      await displayFileContent();
      console.log(`All done, check the file: ${DATA_DIRNAME}/${DATA_FILENAME}. ✨`);
    } else {
      console.warn('Table not found, retrying...')
    };

    await page.close();

    if (!tableFound && attempts >= MAX_RETRIES) {
      console.error("Maximum retries reached. Table could not be found.");
    };
  };

  await browser.close();
};

async function saveData(filename: string, data: any) {
  const dataDirAbsolutePath = resolve(ROOT_DIR, DATA_DIRNAME)
  if (!existsSync(dataDirAbsolutePath)) {
    mkdirSync(dataDirAbsolutePath);
  }
  await writeFile(resolve(dataDirAbsolutePath, filename), JSON.stringify(data, null, 2), {
    encoding: 'utf8',
  });
};

async function displayFileContent() {
  console.log(await readFile(
    resolve(ROOT_DIR, DATA_DIRNAME, DATA_FILENAME),
    { encoding: 'utf8' },
  )
  )
};

fetchGameData(GAME_URL);