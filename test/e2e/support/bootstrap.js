import puppeteer from 'puppeteer';

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( 100000 );

beforeAll( async () => {
	global.browser = await puppeteer.launch();
} );

afterAll( async () => {
	await browser.close();
} );
