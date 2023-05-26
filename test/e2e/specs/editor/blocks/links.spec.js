/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Links', () => {
	const waitForURLFieldAutoFocus = async ( { page } ) => {
		await page.waitForFunction(
			() => !! document.activeElement.closest( '.block-editor-url-input' )
		);
	};

	test.use( {
		linkControl: async ( { page }, use ) => {
			await use( new LinkControl( { page } ) );
		},
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( `can be created by selecting text and using keyboard shortcuts`, async ( {
		page,
		editor,
		pageUtils,
		linkControl,
	} ) => {
		// Create a block with some text.
		await linkControl.clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );

		// Select some text.
		await pageUtils.pressKeys( 'shiftAlt+ArrowLeft' );

		// Press Cmd+K to insert a link.
		await pageUtils.pressKeys( 'primary+K' );

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();

		// Type a URL.
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Open settings.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );

		// Navigate to and toggle the "Open in new tab" checkbox.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );

		// Toggle should still have focus and be checked.
		await page.waitForSelector(
			':focus:checked.components-form-toggle__input'
		);

		// Ensure that the contents of the post have not been changed, since at
		// this point the link is still not inserted.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// Tab back to the Submit and apply the link.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// The link should have been inserted.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test.describe( 'should contain a label when it should open in a new tab', () => {} );
} );

//TODO: refactor into a shared util.
class LinkControl {
	constructor( { page } ) {
		this.page = page;
	}

	async clickBlockAppender() {
		// The block appender is only visible when there's no selection.
		await this.page.evaluate( () =>
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock()
		);
		const appender = await this.page.waitForSelector(
			'.block-editor-default-block-appender__content'
		);
		await appender.click();
		await this.page.evaluate(
			() => new Promise( window.requestIdleCallback )
		);
	}
}
