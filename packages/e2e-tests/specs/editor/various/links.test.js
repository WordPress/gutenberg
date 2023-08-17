/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	pressKeyWithModifier,
	showBlockToolbar,
	pressKeyTimes,
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

	const createAndReselectLink = async () => {
		// Create a block with some text.
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );

		// Select some text.
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );

		// Click on the Link button.
		await page.click( 'button[aria-label="Link"]' );

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();

		// Type a URL.
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Click on the Submit button.
		await page.keyboard.press( 'Enter' );

		// Reselect the link.
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
	};

	describe( 'Editing link text', () => {
		it( 'should allow for modification of link text via Link UI', async () => {
			const originalLinkText = 'Gutenberg';
			const changedLinkText =
				'    link text that was modified via the Link UI to include spaces     ';

			await createAndReselectLink();

			// Make a collapsed selection inside the link. This is used
			// as a stress test to ensure we can find the link text from a
			// collapsed RichTextValue that contains a link format.
			await page.keyboard.press( 'ArrowLeft' );
			await page.keyboard.press( 'ArrowRight' );

			await showBlockToolbar();
			const [ editButton ] = await page.$x(
				'//button[contains(@aria-label, "Edit")]'
			);
			await editButton.click();

			await waitForURLFieldAutoFocus();

			await pressKeyWithModifier( 'shift', 'Tab' );

			const textInputValue = await page.evaluate(
				() => document.activeElement.value
			);

			// At this point, we still expect the text input
			// to reflect the original value with no modifications.
			expect( textInputValue ).toBe( originalLinkText );

			// Select all the link text in the input.
			await pressKeyWithModifier( 'primary', 'a' );

			// Modify the link text value.
			await page.keyboard.type( changedLinkText );

			// Submit the change.
			await page.keyboard.press( 'Enter' );

			// Check the created link reflects the link text.
			const actualLinkText = await canvas().evaluate(
				() =>
					document.querySelector(
						'.block-editor-rich-text__editable a'
					).textContent
			);
			expect( actualLinkText ).toBe( changedLinkText );
		} );

		it( 'should display (capture the) text from the currently active link even if there is a rich text selection', async () => {
			const originalLinkText = 'Gutenberg';

			await createAndReselectLink();

			// Make a collapsed selection inside the link in order
			// to activate the Link UI.
			await page.keyboard.press( 'ArrowLeft' );
			await page.keyboard.press( 'ArrowRight' );

			const [ editButton ] = await page.$x(
				'//button[contains(@aria-label, "Edit")]'
			);
			await editButton.click();
			await waitForURLFieldAutoFocus();

			const [ settingsToggle ] = await page.$x(
				'//button[contains(text(), "Advanced")]'
			);
			await settingsToggle.click();

			// Wait for settings to open.
			await page.waitForXPath( `//label[text()='Open in new tab']` );

			// Move focus back to RichText for the underlying link.
			await pressKeyWithModifier( 'shift', 'Tab' );
			await pressKeyWithModifier( 'shift', 'Tab' );
			await pressKeyWithModifier( 'shift', 'Tab' );

			// Make a selection within the RichText.
			await pressKeyWithModifier( 'shift', 'ArrowRight' );
			await pressKeyWithModifier( 'shift', 'ArrowRight' );
			await pressKeyWithModifier( 'shift', 'ArrowRight' );

			// Move back to the text input.
			await pressKeyTimes( 'Tab', 1 );

			// Tabbing back should land us in the text input.
			const textInputValue = await page.evaluate(
				() => document.activeElement.value
			);

			// Making a selection within the link text whilst the Link UI
			// is open should not alter the value in the Link UI's text
			// input. It should remain as the full text of the currently
			// focused link format.
			expect( textInputValue ).toBe( originalLinkText );
		} );
	} );

	describe( 'Disabling Link UI active state', () => {
		it( 'should not show the Link UI when selection extends beyond link boundary', async () => {
			const linkedText = `Gutenberg`;
			const textBeyondLinkedText = ` and more text.`;

			// Create a block with some text.
			await clickBlockAppender();
			await page.keyboard.type(
				`This is ${ linkedText }${ textBeyondLinkedText }`
			);

			// Move cursor next to end of `linkedText`
			for (
				let index = 0;
				index < textBeyondLinkedText.length;
				index++
			) {
				await page.keyboard.press( 'ArrowLeft' );
			}

			// Select the linkedText.
			await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );

			// Click on the Link button.
			await page.click( 'button[aria-label="Link"]' );

			// Wait for the URL field to auto-focus.
			await waitForURLFieldAutoFocus();

			// Type a URL.
			await page.keyboard.type( 'https://wordpress.org/gutenberg' );

			// Update the link.
			await page.keyboard.press( 'Enter' );

			await page.keyboard.press( 'ArrowLeft' );
			await page.keyboard.press( 'ArrowLeft' );

			expect(
				await page.$(
					'.components-popover__content .block-editor-link-control'
				)
			).not.toBeNull();

			// Make selection starting within the link and moving beyond boundary to the left.
			for ( let index = 0; index < linkedText.length; index++ ) {
				await pressKeyWithModifier( 'shift', 'ArrowLeft' );
			}

			// The Link UI should have disappeared (i.e. be inactive).
			expect(
				await page.$(
					'.components-popover__content .block-editor-link-control'
				)
			).toBeNull();

			// Cancel selection and move back within the Link.
			await page.keyboard.press( 'ArrowRight' );

			// We should see the Link UI displayed again.
			expect(
				await page.$(
					'.components-popover__content .block-editor-link-control'
				)
			).not.toBeNull();

			// Make selection starting within the link and moving beyond boundary to the right.
			await pressKeyWithModifier( 'shift', 'ArrowRight' );
			await pressKeyWithModifier( 'shift', 'ArrowRight' );
			await pressKeyWithModifier( 'shift', 'ArrowRight' );

			// The Link UI should have disappeared (i.e. be inactive).
			expect(
				await page.$(
					'.components-popover__content .block-editor-link-control'
				)
			).toBeNull();
		} );

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
