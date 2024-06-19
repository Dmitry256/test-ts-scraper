import { PlaywrightCrawler, Dataset } from '@crawlee/playwright';
import { extractTableContent, GAME_URL, getTableSourceFromPage } from "./utils"


const crawler = new PlaywrightCrawler({
  async requestHandler({ page, request, log }) {
    const { url } = request;
    log.info(`Processing ${url}...`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(5000);
    const tableSource = await getTableSourceFromPage(page);
    if (tableSource) {
      const extractedTableContent = extractTableContent(tableSource);
      await Dataset.pushData(extractedTableContent);
    } else {
      log.warning('Table not found, try one more time')
    }
  },
  failedRequestHandler({ request }) {
    console.log(`Request ${request.url} failed.`);
  }
});

async function fetchGameData(url: string) {
  crawler.addRequests([url]);
  await crawler.run();
  console.log('Crawler finished.');
  const storedData = await Dataset.getData();
  console.log(JSON.stringify(storedData.items, null, 2));
};

fetchGameData(GAME_URL)