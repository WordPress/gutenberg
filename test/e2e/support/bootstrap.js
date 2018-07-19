/**
 * External dependencies
 */
import puppeteer from 'puppeteer';

/**
 * Node dependencies
 */
import { visitAdmin } from './utils';

const { PUPPETEER_HEADLESS, PUPPETEER_SLOWMO, PUPPETEER_TIMEOUT } = process.env;

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );

beforeAll( async () => {
	global.browser = await puppeteer.launch( {
		headless: PUPPETEER_HEADLESS !== 'false',
		slowMo: parseInt( PUPPETEER_SLOWMO, 10 ) || 0,
	} );
} );

afterAll( async () => {
	page.on( 'dialog', ( dialog ) => {
		dialog.accept();
	} );

	await visitAdmin( 'edit.php' );

	const bulkSelector = await page.$( '#bulk-action-selector-top' );
	if ( bulkSelector ) {
		await page.waitForSelector( '#cb-select-all-1' );
		await page.click( '#cb-select-all-1' );
		await page.select( '#bulk-action-selector-top', 'trash' );
		await page.click( '#doaction' );
		await page.waitForNavigation();
	}

	await browser.close();
} );
