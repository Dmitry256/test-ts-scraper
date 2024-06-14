import { PlaywrightCrawler, Dataset } from '@crawlee/playwright';
import { parse } from 'node-html-parser';

const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request, log }) {
        const { url } = request;
        log.info(`Processing ${url}...`);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });

        const body = await page.content();

        const data: any = {};
        const root = parse(body);
        const tables = root.querySelectorAll('.table.table-bordered.table-hover.table-responsive-flex');
        const table = tables.find(t => !t.id); 

        const rows = table?.querySelectorAll('tr');
        rows?.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 2) {
                const key = cells[0].innerText.trim();
                let value: any = cells[1].innerText.trim();
                    
                const linkElement = cells[1].querySelector('a');
                if (linkElement) {
                    value = {
                        text: linkElement.innerText.trim(),
                        href: linkElement.getAttribute('href') || ''
                    };
                }

                const osIcons = cells[1].querySelectorAll('svg');
                if (osIcons.length > 0) {
                    value = Array.from(cells[1].childNodes)
                        .filter(node => node.nodeType === 3)
                        .map(node => node.textContent.trim())
                        .filter(text => text);
                }
                data[key] = value;
            }
        });

        await Dataset.pushData({
            data
        });
    },
    failedRequestHandler({ request }) {
        console.log(`Request ${request.url} failed.`);
    },
    // headless: false
    // useSessionPool: true, // Use session pool to manage sessions
});

crawler.addRequests([
    'http://steamdb.info/app/730/charts/'
]);

async function crawlerRun() {
    await crawler.run();
    console.log('Crawler finished.');
    const storedData = await Dataset.getData();
    console.log(JSON.stringify(storedData.items, null, 2));
}

crawlerRun()