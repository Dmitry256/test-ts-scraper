import { PlaywrightCrawler, Dataset } from '@crawlee/playwright';
import { parse, HTMLElement } from 'node-html-parser';

const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request, log }) {
        const { url } = request;
        log.info(`Processing ${url}...`);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });

        const htmlSource: string  = await page.content();
        // const extractedTableContent: Record<string, any> = {};
        const fullPageElement = parse(htmlSource);
        const tableSource = fullPageElement.querySelector('.span8 .table.table-bordered.table-hover.table-responsive-flex');

        const extractedTableContent = extractTableContent(tableSource);

        // const rows = tableSource?.querySelectorAll('tr');
        // rows?.forEach(row => {
        //     const cells = row.querySelectorAll('td');
        //     if (cells.length === 2) {
        //         const key = cells[0].innerText.trim();
        //         let value: any = cells[1].innerText.trim();
                    
        //         const linkElement = cells[1].querySelector('a');
        //         if (linkElement) {
        //             value = {
        //                 text: linkElement.innerText.trim(),
        //                 href: linkElement.getAttribute('href') || ''
        //             };
        //         }

        //         const osIcons = cells[1].querySelectorAll('svg');
        //         if (osIcons.length > 0) {
        //             value = Array.from(cells[1].childNodes)
        //                 .filter(node => node.nodeType === 3)
        //                 .map(node => node.textContent.trim())
        //                 .filter(text => text);
        //         }
        //         extractedTableContent[key] = value;
        //     }
        // });

        await Dataset.pushData(extractedTableContent);
    },
    failedRequestHandler({ request }) {
        console.log(`Request ${request.url} failed.`);
    },
});

crawler.addRequests([
    'http://steamdb.info/app/730/charts/'
]);

function extractTableContent(tableSource: HTMLElement | null): Record<string, any> {
    if (tableSource === null) return {}
    const tableContent: Record<string, any> = {};
    const rows = tableSource?.querySelectorAll('tr');
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
                    .map(node => node.textContent?.trim())
                    .filter(text => text);
            }
            tableContent[key] = value;
        }
    })
    return tableContent
}

async function crawlerRun() {
    await crawler.run();
    console.log('Crawler finished.');
    const storedData = await Dataset.getData();
    console.log(JSON.stringify(storedData.items, null, 2));
}

crawlerRun()