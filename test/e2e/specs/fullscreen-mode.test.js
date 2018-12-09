/**
 * Node dependencies
 */
import AxePuppeteer from 'axe-puppeteer';

/**
 * Internal dependencies
 */
import {
	newPost,
	clickOnMoreMenuItem,
	logA11yResults,
} from '../support/utils';

describe( 'Fullscreen Mode', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'should open the fullscreen mode from the more menu', async () => {
		await clickOnMoreMenuItem( 'Fullscreen Mode' );

		const isFullscreenEnabled = await page.$eval( 'body', ( body ) => {
			return body.classList.contains( 'is-fullscreen-mode' );
		} );

		expect( isFullscreenEnabled ).toBe( true );

		const fullscreenToolbar = await page.$( '.edit-post-fullscreen-mode-close__toolbar' );

		expect( fullscreenToolbar ).not.toBeNull();

		const axe = new AxePuppeteer( page );
		axe.include( '.edit-post-layout__content' );
		logA11yResults( await axe.analyze() );
	} );
} );
