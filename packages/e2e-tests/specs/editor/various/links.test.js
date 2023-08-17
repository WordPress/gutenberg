/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	pressKeyWithModifier,
	canvas,
} from '@wordpress/e2e-test-utils';

describe( 'Links', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	const waitForURLFieldAutoFocus = async () => {
		await page.waitForFunction( () => {
			const input = document.querySelector(
				'.block-editor-url-input__input'
			);
			if ( input ) {
				input.focus();
				return true;
			}
			return false;
		} );
	};

	describe( 'Disabling Link UI active state', () => {
		it( 'should not show the Link UI when selection extends into another link', async () => {
			const linkedTextOne = `Gutenberg`;
			const linkedTextTwo = `Block Editor`;
			const linkOneURL = 'https://wordpress.org';
			const linkTwoURL = 'https://wordpress.org/gutenberg';

			// Create a block with some text.
			await clickBlockAppender();
			await page.keyboard.type(
				`This is the ${ linkedTextOne }${ linkedTextTwo }`
			);

			// Select the linkedTextTwo.
			for ( let index = 0; index < linkedTextTwo.length; index++ ) {
				await pressKeyWithModifier( 'shift', 'ArrowLeft' );
			}

			// Click on the Link button.
			await page.click( 'button[aria-label="Link"]' );

			// Wait for the URL field to auto-focus.
			await waitForURLFieldAutoFocus();

			// Type a URL.
			await page.keyboard.type( linkTwoURL );

			// Update the link.
			await page.keyboard.press( 'Enter' );

			// Move cursor next to the **end** of `linkTextOne`
			for ( let index = 0; index < linkedTextTwo.length + 2; index++ ) {
				await page.keyboard.press( 'ArrowLeft' );
			}

			// Select `linkTextOne`
			await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );

			// Click on the Link button.
			await page.click( 'button[aria-label="Link"]' );

			// Wait for the URL field to auto-focus.
			await waitForURLFieldAutoFocus();

			// Type a URL.
			await page.keyboard.type( linkOneURL );

			// Update the link.
			await page.keyboard.press( 'Enter' );

			// Move cursor within `linkTextOne`
			for ( let index = 0; index < 3; index++ ) {
				await page.keyboard.press( 'ArrowLeft' );
			}

			// Link UI should activate for `linkTextOne`
			expect(
				await page.$(
					'.components-popover__content .block-editor-link-control'
				)
			).not.toBeNull();

			// Expand selection so that it overlaps with `linkTextTwo`
			for ( let index = 0; index < 3; index++ ) {
				await pressKeyWithModifier( 'shift', 'ArrowRight' );
			}

			// Link UI should be inactive.
			expect(
				await page.$(
					'.components-popover__content .block-editor-link-control'
				)
			).toBeNull();
		} );

		// Based on issue reported in https://github.com/WordPress/gutenberg/issues/41771/.
		it( 'should correctly replace targetted links text within rich text value when multiple matching values exist', async () => {
			// Create a block with some text.
			await clickBlockAppender();

			// Note the two instances of the string "a".
			await page.keyboard.type( `a b c a` );

			// Select the last "a" only.
			await pressKeyWithModifier( 'shift', 'ArrowLeft' );

			// Click on the Link button.
			await page.click( 'button[aria-label="Link"]' );

			// Wait for the URL field to auto-focus.
			await waitForURLFieldAutoFocus();

			// Type a URL.
			await page.keyboard.type( 'www.wordpress.org' );

			// Update the link.
			await page.keyboard.press( 'Enter' );

			await page.keyboard.press( 'ArrowLeft' );

			// Move to "Edit" button in Link UI
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Enter' );

			await waitForURLFieldAutoFocus();

			// Move to "Text" field.
			await pressKeyWithModifier( 'shift', 'Tab' );

			// Delete existing value from "Text" field
			await page.keyboard.press( 'Delete' );

			// Change text to "z"
			await page.keyboard.type( 'z' );

			await page.keyboard.press( 'Enter' );

			const richTextText = await canvas().evaluate(
				() =>
					document.querySelector(
						'.block-editor-rich-text__editable'
					).textContent
			);
			// Check that the correct (i.e. last) instance of "a" was replaced with "z".
			expect( richTextText ).toBe( 'a b c z' );

			const richTextLink = await canvas().evaluate(
				() =>
					document.querySelector(
						'.block-editor-rich-text__editable a'
					).textContent
			);
			// Check that the correct (i.e. last) instance of "a" was replaced with "z".
			expect( richTextLink ).toBe( 'z' );
		} );
	} );
} );
