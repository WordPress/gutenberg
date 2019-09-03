/**
 * WordPress dependencies
 */
import {
	createNewPost,
	getEditedPostContent,
	insertBlock,
	clickBlockAppender,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'RichText', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should handle change in tag name gracefully', async () => {
		// Regression test: The heading block changes the tag name of its
		// RichText element. Historically this has been prone to breakage,
		// because the Editable component prevents rerenders, so React cannot
		// update the element by itself.
		//
		// See: https://github.com/WordPress/gutenberg/issues/3091
		await insertBlock( 'Heading' );
		await page.click( '[aria-label="Heading 3"]' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should apply formatting with primary shortcut', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'b' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should transform backtick to code', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'A `backtick`' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should undo backtick transform with backspace', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '`a`' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.press( 'Backspace' );

		// Expect "`a`" to be restored.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not undo backtick transform with backspace after typing', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '`a`' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Expect "a" to be deleted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not undo backtick transform with backspace after selection change', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '`a`' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		// Move inside format boundary.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Backspace' );

		// Expect "a" to be deleted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not format text after code backtick', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'A `backtick` and more.' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should update internal selection after fresh focus', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Tab' );
		await pressKeyWithModifier( 'shift', 'Tab' );
		await pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '2' );
		await pressKeyWithModifier( 'primary', 'b' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should keep internal selection after blur', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		// Simulate moving focus to a different app, then moving focus back,
		// without selection being changed.
		await page.evaluate( () => {
			const activeElement = document.activeElement;
			activeElement.blur();
			activeElement.focus();
		} );
		// Wait for the next animation frame, see the focus event listener in
		// RichText.
		await page.evaluate( () => new Promise( window.requestAnimationFrame ) );
		await pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '2' );
		await pressKeyWithModifier( 'primary', 'b' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
