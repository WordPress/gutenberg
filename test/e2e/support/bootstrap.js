/**
 * External dependencies
 */
import puppeteer from 'puppeteer';

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( 100000 );

const {
	E2E_EXECUTABLE_PATH,
	E2E_HEADLESS,
	E2E_SLOWMO = 0,
} = process.env;

beforeAll( async () => {
	global.browser = await puppeteer.launch( {
		executablePath: E2E_EXECUTABLE_PATH,
		headless: 'false' !== E2E_HEADLESS,
		slowMo: Number( E2E_SLOWMO ),
	} );
} );

afterAll( async () => {
	await browser.close();
} );
