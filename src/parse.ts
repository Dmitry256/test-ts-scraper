import { PlaywrightCrawler, Dataset, LogLevel } from '@crawlee/playwright';
import { extractTableContent, GAME_URL, ROOT_DIR, RETRY_TIMEOUT_INCREMENT,
  getTableSourceFromPage, MAX_RETRIES } from "./utils";
import { resolve } from 'path';

const DATA_FILENAME = "gameDataFromCrowler.json";
const DATA_DIRNAME = "storage";

const crawler = new PlaywrightCrawler({
  maxRequestRetries: MAX_RETRIES,
  async requestHandler({ page, request, log }) {
    log.setOptions
    const { url, retryCount } = request; //const url = request.url; const retryCount = request.retryCount
    log.info(`Processing ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    let timeout: number = retryCount * RETRY_TIMEOUT_INCREMENT;

    await page.waitForTimeout(timeout);

    const tableSource = await getTableSourceFromPage(page);
    if (tableSource) {
      const extractedTableContent = extractTableContent(tableSource);
      await Dataset.pushData(extractedTableContent);
    } else {
      throw new Error('Table not found...');
    };
  },
  failedRequestHandler({ request }) {
    console.log(`Request ${request.url} failed.`);
  }
});

async function fetchGameData(url: string) {
  crawler.addRequests([url]);
  crawler.log.setLevel(LogLevel.INFO);
  let finalStatistic = await crawler.run();
  console.log('Crawler finished.');

  if (finalStatistic.requestsFinished > 0) {
    const dataDirAbsolutePath = resolve(ROOT_DIR, DATA_DIRNAME);
    const [storedData] = await Promise.all([
      Dataset.getData(),
      Dataset.exportToJSON(
        DATA_FILENAME,
        { toKVS: dataDirAbsolutePath }
      )
    ])
    console.log(JSON.stringify(storedData.items[0], null, 2));
  };
};

fetchGameData(GAME_URL);