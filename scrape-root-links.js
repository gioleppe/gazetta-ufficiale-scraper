const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // let years = [2023, 2024];
    // generator for years from 2000 to 2024
    let years = Array.from({length: 2025 - 2000}, (v, k) => k + 2000);

    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    for (const year of years) {
        await page.goto(`https://www.gazzettaufficiale.it/ricercaArchivioCompleto/serie_generale/${year}`);
        const data = await page.evaluate(() => {
            const links = Array.from(document.getElementsByClassName('elenco_gazzette')).map(a => a.href);
            return links;
        });
        fs.writeFileSync(path.join(dataDir, `root-links-${year}.txt`), data.join('\n'), { flag: 'w' });
        // sleep for 3 second to avoid being banned
        await page.waitForTimeout(3000);
    }

    await browser.close();
  } catch (error) {
    console.error('Error during scraping:', error);
  }
})();
