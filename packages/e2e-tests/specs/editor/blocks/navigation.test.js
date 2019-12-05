
/**
 * WordPress dependencies
 */
import {
	createNewPost,
	getEditedPostContent,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Navigation', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'allows a navigation menu to be created using existing pages', async () => {
		// Add the navigation block.
		await insertBlock( 'Navigation' );

		// Create an empty nav block.
		const [ createFromExistingButton ] = await page.$x( '//button[text()="Create from all top pages"]' );
		await createFromExistingButton.click();

		// Snapshot should contain the default 'Sample Page'.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'allows a navigation menu to be created from an empty menu using a mixture of internal and external links', async () => {
		// Add the navigation block.
		await insertBlock( 'Navigation' );

		// Create an empty nav block.
		const [ createEmptyButton ] = await page.$x( '//button[text()="Create empty"]' );
		await createEmptyButton.click();

		// Add a link to the default Navigation Link block.
		await page.type( 'input[placeholder="Search or type url"]', 'https://wordpress.org' );
		await page.keyboard.press( 'Enter' );
		await page.type( '.wp-block-navigation-link__content.is-selected', 'Home' );

		// Add another Navigation Link block.
		// Using 'click' here checks for regressions of https://github.com/WordPress/gutenberg/issues/18329,
		// an issue where the block appender requires two clicks.
		await page.click( '.wp-block-navigation .block-list-appender' );

		// Add a link to the default Navigation Link block.
		await page.type( 'input[placeholder="Search or type url"]', 'Sample Page' );
		await page.keyboard.press( 'Enter' );
		await page.type( '.wp-block-navigation-link__content.is-selected', 'Sample' );

		// Expect a Navigation Block with two Navigation Links in the snapshot.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
