
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
		const navigationAppender = '.wp-block-navigation .block-list-appender';
		const emptyOption = '.wp-block-navigation-placeholder__button.is-link';
		const linkInput = '.block-editor-link-control__search-input';
		const navigationLink = '.wp-block-navigation-link';

		await insertBlock( 'Navigation' );

		await page.waitForSelector( emptyOption );
		await page.click( emptyOption );
		await page.waitForSelector( linkInput );
		await page.type( linkInput, 'http://example.com' );
		await page.keyboard.press( 'Enter' );
		await page.click( navigationAppender );

		const navigationLinkCount = await page.$$eval( navigationLink, ( navigationLinks ) => navigationLinks.length );

		expect( navigationLinkCount ).toBe( 2 );
	} );
} );
