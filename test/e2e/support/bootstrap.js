import puppeteer from 'puppeteer';

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( 50000 );

beforeAll( async () => {
	global.browser = await puppeteer.launch();
	global.page = await browser.newPage();
	await page.setViewport( { width: 1000, height: 700 } );
} );

afterAll( async () => {
	await browser.close();
} );
