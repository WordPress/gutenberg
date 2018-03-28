/**
 * External dependencies
 */
import puppeteer from 'puppeteer';

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( 100000 );

const {
	E2E_EXECUTABLE_PATH,
} = process.env;

beforeAll( async () => {
	global.browser = await puppeteer.launch( {
		executablePath: E2E_EXECUTABLE_PATH,
	} );
} );

afterAll( async () => {
	await browser.close();
} );
