/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Embed block inside a locked all parent', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-innerblocks-locking-all-embed' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-innerblocks-locking-all-embed' );
	} );

	it( 'embed block should be able to embed external content', async () => {
		await insertBlock( 'Test Inner Blocks Locking All Embed' );
		const embedInputSelector = '.components-placeholder__input[aria-label="Embed URL"]';
		await page.waitForSelector( embedInputSelector );
		await page.click( embedInputSelector );
		// This URL should not have a trailing slash.
		await page.keyboard.type( 'https://twitter.com/WordPress' );
		await page.keyboard.press( 'Enter' );
		// The twitter block should appear correctly.
		await page.waitForSelector( 'figure.wp-block-embed' );
	} );
} );
