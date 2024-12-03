const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// read a file with root links and scrape the index links in each root link
(async () => {
    try {
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        let year = 2024;

        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        const rootLinks = fs.readFileSync(path.join(__dirname, 'data', `root-links-${year}.txt`), 'utf-8').split('\n');
        console.log(`Found ${rootLinks.length} root links to process.`);

        for (const [index, rootLink] of rootLinks.entries()) {
            console.log(`Processing root link ${index + 1}/${rootLinks.length}: ${rootLink}`);
            await page.goto(rootLink);
            let gazetteNumber = rootLink.split('numeroGazzetta=')[1];
            let gazetteDate = rootLink.split('dataPubblicazioneGazzetta=')[1].split('&')[0];
            // create a directory for the year
            const rootDir = path.join(dataDir, `${year}`);
            if (!fs.existsSync(rootDir)) {
                fs.mkdirSync(rootDir);
            }
            // create a directory for the gazette number and date 
            const gazetteDir = path.join(rootDir, `${gazetteNumber}-${gazetteDate}`);
            if (!fs.existsSync(gazetteDir)) {
                fs.mkdirSync(gazetteDir);
            }

            // all the interesting links are in the first child of the .risultato class elements
            const data = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('.risultato')).map(a => a.firstElementChild.href);
                return links;
            });
            // if the file already exists, delete it
            fs.writeFileSync(path.join(gazetteDir, `index-links-${gazetteNumber}.txt`), data.join('\n'), { flag: 'w' });
            console.log(`Saved index links for gazette number ${gazetteNumber} on date ${gazetteDate}.`);
            await page.waitForTimeout(3000);
        }

        await browser.close();
        console.log('Scraping completed successfully.');
    } catch (error) {
        console.error('Error during scraping:', error);
    }
})();
