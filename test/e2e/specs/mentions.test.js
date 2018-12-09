/**
 * Node dependencies
 */
import AxePuppeteer from 'axe-puppeteer';

/**
 * Internal dependencies
 */
import {
	newPost,
	getEditedPostContent,
	clickBlockAppender,
	logA11yResults,
} from '../support/utils';

describe( 'autocomplete mentions', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'should insert mention', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'I am @a' );
		await page.waitForSelector( '.components-autocomplete__result' );

		const axe = new AxePuppeteer( page );
		axe.include( '.components-autocomplete__result' );
		logA11yResults( await axe.analyze() );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '.' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
