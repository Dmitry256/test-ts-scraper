import { parse, HTMLElement, NodeType } from 'node-html-parser';
import { Page } from 'playwright'


/**Константа для выбора таблицы с необходимыми данными */
const TABLE_SELECTOR = ".span8 .table.table-bordered.table-hover.table-responsive-flex"

/**URL страницы*/
export const GAME_URL = "http://steamdb.info/app/730/charts/"


export async function getTableSourceFromPage(page: Page): Promise<HTMLElement | null> {
  const htmlSource: string = await page.content();
  const fullPageElement = parse(htmlSource);
  return fullPageElement.querySelector(TABLE_SELECTOR);
}


export function extractTableContent(tableSource: HTMLElement | null): Record<string, any> {
  if (tableSource === null) return {};
  const tableContent: Record<string, any> = {};
  const rows = tableSource.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 2) {
      const key = cells[0].innerText.trim();
      let value: any = parseStringOrNumber(cells[1].innerText.trim());

      if (isString(value)) { value = parseStringOrDate(value) };

      const linkElement = cells[1].querySelector('a');
      if (linkElement) { value = linkElementParse(linkElement); }
      else {
        const osIcons = cells[1].querySelectorAll('svg');
        if (osIcons.length > 0) { value = supportedSystemsElementParse(cells[1]) };
      };
      tableContent[key] = value;
    };
  });
  return tableContent
};

function supportedSystemsElementParse(supportedSystemsCell: HTMLElement): string[] {
  const steamDeckPlayable = supportedSystemsCell.querySelectorAll('[aria-label="Steam Deck: Playable"]')
  const systemsArray = Array.from(supportedSystemsCell.childNodes)
    .filter(node => node.nodeType === NodeType.TEXT_NODE)
    .map(node => node.textContent?.trim())
    .filter(text => text);
  if (steamDeckPlayable.length > 0) { systemsArray.push('Steam Deck') };
  return systemsArray
}

function linkElementParse(linkElement: HTMLElement): {
  text: string | number;
  href: string | undefined;
} {
  return {
    text: parseStringOrNumber(linkElement.innerText.trim()),
    href: linkElement.getAttribute('href')
  };
}

function isString(value: any): value is string {
  return typeof value === 'string';
};

function parseStringOrNumber(inputString: string): string | number {
  const number = Number(inputString)
  if (isNaN(number)) return inputString;
  else return number
};

function parseStringOrDate(inputString: string): string | Date {
  if (inputString.search(/\d{2} \w{3,9} \d{4} – \d{2}:\d{2}:\d{2} (UTC)/) == 0) {
    const dateArray = inputString.split(' ');
    const [day, month, year, _, time, timezone] = dateArray
    return new Date(`${month} ${day}, ${year} ${time} ${timezone}`);
  } else return inputString
};