/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	getEditedPostContent,
	pressKeyWithModifier,
	publishPost,
} from '@wordpress/e2e-test-utils';

describe( 'Link color', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	const waitForAutoFocus = async () => {
		await page.waitForFunction(
			() => !! document.activeElement.closest( '.block-editor-url-input' )
		);
	};

	it( 'control serializes markup properly', async () => {
		// Create a block with some text
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );

		// Select some text
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );

		// Click on the Link button
		await page.click( 'button[aria-label="Link"]' );

		// Wait for the URL field to auto-focus
		await waitForAutoFocus();

		// Type a URL
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Submit the link
		await page.keyboard.press( 'Enter' );

		// Simulate the theme has support for link color
		await page.evaluate( () => {
			wp.data.dispatch( 'core/block-editor' ).updateSettings( {
				__experimentalFeatures: {
					global: {
						color: { link: true },
					},
				},
			} );
		} );

		// Open color panel
		await page.click(
			'.block-editor-panel-color-gradient-settings .components-panel__body-toggle'
		);

		// Select first color
		await page.click(
			'.block-editor-panel-color-gradient-settings > .block-editor-color-gradient-control:last-child .components-circular-option-picker__option:first-child'
		);

		// Save post.
		// We want to test that the link color control data
		// persists after kses runs (kses filters out some markup,
		// such as CSS variables within the style property).
		await publishPost();

		// Snapshot contains .has-link-color class and inline CSS variable
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
