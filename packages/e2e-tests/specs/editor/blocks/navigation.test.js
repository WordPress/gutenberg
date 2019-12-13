
/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Adds Navigation links', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should add a link with one click', async () => {
		await insertBlock( 'Navigation' );
		const [ createEmptyButton ] = await page.$x( '//button[text()="Create empty"]' );
		await createEmptyButton.click();
		await page.waitForSelector( 'input[placeholder="Search or type url"]' );
		await page.type( 'input[placeholder="Search or type url"]', 'http://example.com' );

		await page.keyboard.press( 'Enter' );
		await page.click( '.wp-block-navigation .block-list-appender' );

		const navigationLinkCount = await page.$$eval( '.wp-block-navigation-link', ( navigationLinks ) => navigationLinks.length );

		expect( navigationLinkCount ).toBe( 2 );
	} );
} );
