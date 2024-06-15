import { PlaywrightCrawler, Dataset } from '@crawlee/playwright';
import { parse, HTMLElement, NodeType } from 'node-html-parser';

const crawler = new PlaywrightCrawler({
    async requestHandler({ page, request, log }) {
        const { url } = request;
        log.info(`Processing ${url}...`);
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });
        const htmlSource: string  = await page.content();
        const fullPageElement = parse(htmlSource);
        const tableSource = fullPageElement.querySelector('.span8 .table.table-bordered.table-hover.table-responsive-flex');
        const extractedTableContent = extractTableContent(tableSource);
        await Dataset.pushData(extractedTableContent);
    },
    failedRequestHandler({ request }) {
        console.log(`Request ${request.url} failed.`);
    }
});



function extractTableContent(tableSource: HTMLElement | null): Record<string, any> {
    if (tableSource === null) return {}
    const tableContent: Record<string, any> = {};
    const rows = tableSource.querySelectorAll('tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 2) {
            const key = cells[0].innerText.trim();
            let value: any = stingToNumber(cells[1].innerText.trim());
                
            const linkElement = cells[1].querySelector('a');
            if (linkElement) {
                value = {
                    text: linkElement.innerText.trim(),
                    href: linkElement.getAttribute('href')
                };
            }

            const osIcons = cells[1].querySelectorAll('svg');
            if (osIcons.length > 0) {
                value = Array.from(cells[1].childNodes)
                    .filter(node => node.nodeType === NodeType.TEXT_NODE)
                    .map(node => node.textContent?.trim())
                    .filter(text => text);
            }
            tableContent[key] = value;
        }
    });

    return tableContent
}

function stingToNumber(inputString: string): string | number {
    const number = Number(inputString)
    if (isNaN(number)) return inputString; 
    else return number
};

async function fetchGameData(url: string) {
    crawler.addRequests([url]);
    await crawler.run();
    console.log('Crawler finished.');
    const storedData = await Dataset.getData();
    console.log(JSON.stringify(storedData.items, null, 2));
}

fetchGameData('http://steamdb.info/app/730/charts/')