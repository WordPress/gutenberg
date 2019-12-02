
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
		const existingPagesOption = '.wp-block-navigation-placeholder__button.is-default';
		const navigationLink = '.wp-block-navigation-link';

		await insertBlock( 'Navigation' );

		await page.waitForSelector( existingPagesOption );
		await page.click( existingPagesOption );
		await page.waitForSelector( navigationAppender );
		await page.click( navigationAppender );

		const navigationLinkCount = await page.$$eval( navigationLink, ( navigationLinks ) => navigationLinks.length );

		expect( navigationLinkCount ).toBe( 2 );
	} );
} );
