import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        page.on('pageerror', err => console.log('PAGE ERROR:', err));
        page.on('console', msg => console.log('CONSOLE:', msg.text()));

        await page.goto('http://localhost:8081');
        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
