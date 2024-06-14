// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
import { chromium } from "playwright-extra";

// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
// Note: playwright-extra is compatible with most puppeteer-extra plugins
const stealth = require("puppeteer-extra-plugin-stealth")();

// Add the plugin to Playwright (any number of plugins can be added)
chromium.use(stealth);



const browserOptions = {
    ignoreHTTPSErrors: true,
    hadless: false,
    args: ['--ignore-certificate-errors'],
    proxy: {
        server: 'brd.superproxy.io:22225',
        username: 'brd-customer-hl_7e59cffa-zone-residential_proxy1',
        password: 'v4n5esbtojxn'
    },
};

// That's it. The rest is Playwright usage as normal 😊
(async() => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });
  // const page1 = await context.newPage();
  // await page1.goto("https://google.com", { waitUntil: "domcontentloaded" });

  
  const page = await context.newPage();

  console.log("Testing the stealth plugin..");
//   await page.goto("https://g2.com", { waitUntil: "domcontentloaded" });
  await page.goto("https://steamdb.info/app/730/charts/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000)
  await page.screenshot({ path: "g2 passed.png", fullPage: true });

  const content = await page.content();

  console.log(content)

  console.log("All done, check the screenshot. ✨");
  await browser.close();
})();
