/**
 * WordPress dependencies
 */
import {
	insertBlock,
	getEditedPostContent,
	createNewPost,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'Buttons', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'has focus on button content', async () => {
		await insertBlock( 'Buttons' );
		await page.keyboard.type( 'Content' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'dismisses link editor when escape is pressed', async () => {
		// Regression: https://github.com/WordPress/gutenberg/pull/19885
		await insertBlock( 'Buttons' );
		await pressKeyWithModifier( 'primary', 'k' );
		await page.waitForFunction(
			() => !! document.activeElement.closest( '.block-editor-url-input' )
		);
		await page.keyboard.press( 'Escape' );
		await page.waitForFunction(
			() =>
				document.activeElement ===
				document.querySelector( '.block-editor-rich-text__editable' )
		);
		await page.keyboard.type( 'WordPress' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'moves focus from the link editor back to the button when escape is pressed after the URL has been submitted', async () => {
		// Regression: https://github.com/WordPress/gutenberg/issues/34307
		await insertBlock( 'Buttons' );
		await pressKeyWithModifier( 'primary', 'k' );
		await page.waitForFunction(
			() => !! document.activeElement.closest( '.block-editor-url-input' )
		);
		await page.keyboard.type( 'https://example.com' );
		await page.keyboard.press( 'Enter' );
		await page.waitForFunction(
			() =>
				document.activeElement ===
				document.querySelector(
					'.block-editor-link-control a[href="https://example.com"]'
				)
		);
		await page.keyboard.press( 'Escape' );

		// Focus should move from the link control to the button block's text.
		await page.waitForFunction(
			() =>
				document.activeElement ===
				document.querySelector( '[aria-label="Button text"]' )
		);

		// The link control should still be visible when a URL is set.
		const linkControl = await page.$( '.block-editor-link-control' );
		expect( linkControl ).toBeTruthy();
	} );

	it( 'can jump to the link editor using the keyboard shortcut', async () => {
		await insertBlock( 'Buttons' );
		await page.keyboard.type( 'WordPress' );
		await pressKeyWithModifier( 'primary', 'k' );
		await page.keyboard.type( 'https://www.wordpress.org/' );
		await page.keyboard.press( 'Enter' );
		// Make sure that the dialog is still opened, and that focus is retained
		// within (focusing on the link preview).
		await page.waitForSelector(
			':focus.block-editor-link-control__search-item-title'
		);

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
