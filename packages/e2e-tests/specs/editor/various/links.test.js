/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	clickBlockToolbarButton,
	getEditedPostContent,
	createNewPost,
	pressKeyWithModifier,
	showBlockToolbar,
} from '@wordpress/e2e-test-utils';

describe( 'Links', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	const waitForURLFieldAutoFocus = async () => {
		await page.waitForFunction(
			() => !! document.activeElement.closest( '.block-editor-url-input' )
		);
	};

	it( 'will use Post title as link text if link to existing post is created without any text selected', async () => {
		const titleText = 'Post to create a link to';
		await createPostWithTitle( titleText );

		await createNewPost();
		await clickBlockAppender();

		// Now in a new post and try to create a link from an autocomplete suggestion using the keyboard.
		await page.keyboard.type( 'Here comes a link: ' );

		// Press Cmd+K to insert a link.
		await pressKeyWithModifier( 'primary', 'K' );

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();
		expect(
			await page.$(
				'.components-popover__content .block-editor-link-control'
			)
		).not.toBeNull();

		// Trigger the autocomplete suggestion list and select the first suggestion.
		await page.keyboard.type( titleText.substr( 0, titleText.length - 2 ) );
		await page.waitForSelector( '.block-editor-link-control__search-item' );
		await page.keyboard.press( 'ArrowDown' );

		await page.keyboard.press( 'Enter' );

		const actualText = await page.evaluate(
			() =>
				document.querySelector( '.block-editor-rich-text__editable a' )
					.textContent
		);
		expect( actualText ).toBe( titleText );
	} );

	it( 'can be created by selecting text and clicking Link', async () => {
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

		// Submit the link.
		await page.keyboard.press( 'Enter' );

		// The link should have been inserted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'will not automatically create a link if selected text is not a valid HTTP based URL', async () => {
		// Create a block with some text.
		await clickBlockAppender();
		await page.keyboard.type( 'This: is not a link' );

		// Select some text.
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );

		// Click on the Link button.
		await page.click( 'button[aria-label="Link"]' );

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();

		const urlInputValue = await page.evaluate(
			() => document.querySelector( '[aria-label="URL"]' ).value
		);

		expect( urlInputValue ).toBe( '' );
	} );

	it( 'can be created by selecting text and using keyboard shortcuts', async () => {
		// Create a block with some text.
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );

		// Select some text.
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );

		// Press Cmd+K to insert a link.
		await pressKeyWithModifier( 'primary', 'K' );

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();

		// Type a URL.
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Navigate to and toggle the "Open in new tab" checkbox.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );

		// Toggle should still have focus and be checked.
		await page.waitForSelector(
			':focus:checked.components-form-toggle__input'
		);

		// Ensure that the contents of the post have not been changed, since at
		// this point the link is still not inserted.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Tab back to the Submit and apply the link.
		await pressKeyWithModifier( 'shift', 'Tab' );
		await page.keyboard.press( 'Enter' );

		// The link should have been inserted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created without any text selected', async () => {
		// Create a block with some text.
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg: ' );

		// Press Cmd+K to insert a link.
		await pressKeyWithModifier( 'primary', 'K' );

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();

		// Type a URL.
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Press Enter to apply the link.
		await page.keyboard.press( 'Enter' );

		// A link with the URL as its text should have been inserted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created instantly when a URL is selected', async () => {
		// Create a block with some text.
		await clickBlockAppender();
		await page.keyboard.type(
			'This is Gutenberg: https://wordpress.org/gutenberg'
		);

		// Select the URL.
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );

		// Click on the Link button.
		await page.click( 'button[aria-label="Link"]' );

		// A link with the selected URL as its href should have been inserted.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'is not created when we click away from the link input', async () => {
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

		// Click somewhere else - it doesn't really matter where.
		await page.click( '.editor-post-title' );
	} );

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

	it( 'can be edited', async () => {
		await createAndReselectLink();

		// Click on the Edit button.
		const [ editButton ] = await page.$x(
			'//button[contains(@aria-label, "Edit")]'
		);
		await editButton.click();

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();

		// Change the URL.
		await page.keyboard.type( '/handbook' );

		// Submit the link.
		await page.keyboard.press( 'Enter' );

		// The link should have been updated.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be removed', async () => {
		await createAndReselectLink();

		// Click on the Unlink button
		// await page.click( 'button[aria-label="Unlink"]' );

		// Unlick via shortcut
		// we do this to avoid an layout edge case whereby
		// the rich link preview popover will obscure the block toolbar
		// under very specific circumstances and screensizes.
		await pressKeyWithModifier( 'primaryShift', 'K' );

		// The link should have been removed.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	const toggleFixedToolbar = async ( isFixed ) => {
		await page.evaluate( ( _isFixed ) => {
			const { select, dispatch } = wp.data;
			const isCurrentlyFixed = select( 'core/edit-post' ).isFeatureActive(
				'fixedToolbar'
			);
			if ( isCurrentlyFixed !== _isFixed ) {
				dispatch( 'core/edit-post' ).toggleFeature( 'fixedToolbar' );
			}
		}, isFixed );
	};

	it( 'allows Left to be pressed during creation when the toolbar is fixed to top', async () => {
		await toggleFixedToolbar( true );

		await clickBlockAppender();
		await page.keyboard.type( 'Text' );
		await page.click( 'button[aria-label="Link"]' );

		// Typing "left" should not close the dialog.
		await page.keyboard.press( 'ArrowLeft' );
		let popover = await page.$(
			'.components-popover__content .block-editor-link-control'
		);
		expect( popover ).not.toBeNull();

		// Escape should close the dialog still.
		await page.keyboard.press( 'Escape' );
		popover = await page.$(
			'.components-popover__content .block-editor-link-control'
		);
		expect( popover ).toBeNull();
	} );

	it( 'allows Left to be pressed during creation in "Docked Toolbar" mode', async () => {
		await toggleFixedToolbar( false );

		await clickBlockAppender();
		await page.keyboard.type( 'Text' );

		await clickBlockToolbarButton( 'Link' );

		// Typing "left" should not close the dialog.
		await page.keyboard.press( 'ArrowLeft' );
		let popover = await page.$(
			'.components-popover__content .block-editor-link-control'
		);
		expect( popover ).not.toBeNull();

		// Escape should close the dialog still.
		await page.keyboard.press( 'Escape' );
		popover = await page.$(
			'.components-popover__content .block-editor-link-control'
		);
		expect( popover ).toBeNull();
	} );

	it( 'can be edited with collapsed selection', async () => {
		await createAndReselectLink();
		// Make a collapsed selection inside the link
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowRight' );
		await showBlockToolbar();
		const [ editButton ] = await page.$x(
			'//button[contains(@aria-label, "Edit")]'
		);
		await editButton.click();
		await waitForURLFieldAutoFocus();
		await page.keyboard.type( '/handbook' );
		await page.keyboard.press( 'Enter' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	const createPostWithTitle = async ( titleText ) => {
		await createNewPost();
		await page.type( '.editor-post-title__input', titleText );
		await page.click( '.editor-post-publish-panel__toggle' );

		// Disable reason: Wait for the animation to complete, since otherwise the
		// click attempt may occur at the wrong point.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 100 );

		// Publish the post.
		await page.click( '.editor-post-publish-button' );

		// Return the URL of the new post.
		await page.waitForSelector(
			'.post-publish-panel__postpublish-post-address input'
		);
		return page.evaluate(
			() =>
				document.querySelector(
					'.post-publish-panel__postpublish-post-address input'
				).value
		);
	};

	it( 'allows use of escape key to dismiss the url popover', async () => {
		const titleText = 'Test post escape';
		await createPostWithTitle( titleText );

		await createNewPost();
		await clickBlockAppender();

		// Now in a new post and try to create a link from an autocomplete suggestion using the keyboard.
		await page.keyboard.type( 'This is Gutenberg' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );

		// Press Cmd+K to insert a link.
		await pressKeyWithModifier( 'primary', 'K' );

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();
		expect(
			await page.$(
				'.components-popover__content .block-editor-link-control'
			)
		).not.toBeNull();

		// Trigger the autocomplete suggestion list and select the first suggestion.
		await page.keyboard.type( titleText );
		await page.waitForSelector( '.block-editor-link-control__search-item' );
		await page.keyboard.press( 'ArrowDown' );

		// Expect the the escape key to dismiss the popover when the autocomplete suggestion list is open.
		await page.keyboard.press( 'Escape' );
		expect(
			await page.$(
				'.components-popover__content .block-editor-link-control'
			)
		).toBeNull();

		// Confirm that selection is returned to where it was before launching
		// the link editor, with "Gutenberg" as an uncollapsed selection.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '.' );
		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Press Cmd+K to insert a link.
		await pressKeyWithModifier( 'primary', 'K' );

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();
		expect(
			await page.$(
				'.components-popover__content .block-editor-link-control'
			)
		).not.toBeNull();

		// Expect the the escape key to dismiss the popover normally.
		await page.keyboard.press( 'Escape' );
		expect(
			await page.$(
				'.components-popover__content .block-editor-link-control'
			)
		).toBeNull();

		// Press Cmd+K to insert a link.
		await pressKeyWithModifier( 'primary', 'K' );

		// Wait for the URL field to auto-focus.
		await waitForURLFieldAutoFocus();
		expect(
			await page.$(
				'.components-popover__content .block-editor-link-control'
			)
		).not.toBeNull();

		// Tab to the "Open in new tab" toggle.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		// Expect the the escape key to dismiss the popover normally.
		await page.keyboard.press( 'Escape' );
		expect(
			await page.$(
				'.components-popover__content .block-editor-link-control'
			)
		).toBeNull();
	} );

	it( 'can be modified using the keyboard once a link has been set', async () => {
		const URL = 'https://wordpress.org/gutenberg';

		// Create a block with some text and format it as a link.
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'primary', 'K' );
		await waitForURLFieldAutoFocus();
		await page.keyboard.type( URL );
		await page.keyboard.press( 'Enter' );

		// Deselect the link text by moving the caret to the end of the line
		// and the link popover should not be displayed.
		await page.keyboard.press( 'End' );
		expect(
			await page.$(
				'.components-popover__content .block-editor-link-control'
			)
		).toBeNull();

		// Move the caret back into the link text and the link popover
		// should be displayed.
		await page.keyboard.press( 'ArrowLeft' );
		expect(
			await page.$(
				'.components-popover__content .block-editor-link-control'
			)
		).not.toBeNull();

		// Press Cmd+K to edit the link and the url-input should become
		// focused with the value previously inserted.
		await pressKeyWithModifier( 'primary', 'K' );
		await waitForURLFieldAutoFocus();
		const isInURLInput = await page.evaluate(
			() => !! document.activeElement.closest( '.block-editor-url-input' )
		);
		expect( isInURLInput ).toBe( true );
		const activeElementValue = await page.evaluate(
			() => document.activeElement.value
		);
		expect( activeElementValue ).toBe( URL );

		// Confirm that submitting the input without any changes keeps the same
		// value and moves focus back to the paragraph.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '.' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'adds an assertive message for screenreader users when an invalid link is set', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'primary', 'K' );
		await waitForURLFieldAutoFocus();
		await page.keyboard.type( 'http://#test.com' );
		await page.keyboard.press( 'Enter' );
		const assertiveContent = await page.evaluate(
			() => document.querySelector( '#a11y-speak-assertive' ).textContent
		);
		expect( assertiveContent.trim() ).toBe(
			'Warning: the link has been inserted but may have errors. Please test it.'
		);
	} );

	it( 'should contain a label when it should open in a new tab', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'This is WordPress' );
		// Select "WordPress".
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'primary', 'k' );
		await waitForURLFieldAutoFocus();
		await page.keyboard.type( 'w.org' );

		// Navigate to and toggle the "Open in new tab" checkbox.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );

		// Confirm that focus was not prematurely returned to the paragraph on
		// a changing value of the setting.
		await page.waitForSelector( ':focus.components-form-toggle__input' );

		// Close dialog. Expect that "Open in new tab" would have been applied
		// immediately.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		// Wait for Gutenberg to finish the job.
		await page.waitForXPath(
			'//a[contains(@href,"w.org") and @target="_blank"]'
		);

		expect( await getEditedPostContent() ).toMatchSnapshot();

		// Regression Test: This verifies that the UI is updated according to
		// the expected changed values, where previously the value could have
		// fallen out of sync with how the UI is displayed (specifically for
		// collapsed selections).
		//
		// See: https://github.com/WordPress/gutenberg/pull/15573

		// Move caret back into the link.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Edit link.
		await pressKeyWithModifier( 'primary', 'k' );
		await waitForURLFieldAutoFocus();
		await pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( 'wordpress.org' );

		// Update the link.
		await page.keyboard.press( 'Enter' );

		// Navigate back to the popover.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );

		// Navigate back to inputs to verify appears as changed.
		await pressKeyWithModifier( 'primary', 'k' );
		await waitForURLFieldAutoFocus();

		// Navigate to the "Open in new tab" checkbox.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		// Uncheck the checkbox.
		await page.keyboard.press( 'Space' );

		// Wait for Gutenberg to finish the job.
		await page.waitForXPath(
			'//a[contains(@href,"wordpress.org") and not(@target)]'
		);

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	describe( 'Editing link text', () => {
		it( 'should not display text input when initially creating the link', async () => {
			// Create a block with some text.
			await clickBlockAppender();
			await page.keyboard.type( 'This is Gutenberg: ' );

			// Press Cmd+K to insert a link.
			await pressKeyWithModifier( 'primary', 'K' );

			// Wait for the URL field to auto-focus.
			await waitForURLFieldAutoFocus();

			const textInput = await page
				.waitForXPath(
					'//[contains(@class, "block-editor-link-control__search-input-wrapper")]//label[contains(text(), "Text")]',
					{
						timeout: 1000,
					}
				)
				.catch( () => false );

			expect( textInput ).toBeFalsy();
		} );

		it( 'should display text input when the link has a valid URL value', async () => {
			await createAndReselectLink();

			// Make a collapsed selection inside the link. This is used
			// as a stress test to ensure we can find the link text from a
			// collapsed RichTextValue that contains a link format.
			await page.keyboard.press( 'ArrowLeft' );
			await page.keyboard.press( 'ArrowRight' );

			const [ editButton ] = await page.$x(
				'//button[contains(@aria-label, "Edit")]'
			);
			await editButton.click();
			await waitForURLFieldAutoFocus();

			await pressKeyWithModifier( 'shift', 'Tab' );

			// Tabbing back should land us in the text input.
			const { isTextInput, textValue } = await page.evaluate( () => {
				const el = document.activeElement;

				return {
					isTextInput: el.matches( 'input[type="text"]' ),
					textValue: el.value,
				};
			} );

			// Let's check we've focused a text input.
			expect( isTextInput ).toBe( true );

			// Link was created on text value "Gutenberg". We expect
			// the text input to reflect that value.
			expect( textValue ).toBe( 'Gutenberg' );
		} );

		it( 'should preserve trailing/leading whitespace from linked text in text input', async () => {
			const textToSelect = `         spaces     `;
			const textWithWhitespace = `Text with leading and trailing${ textToSelect }`;

			// Create a block with some text.
			await clickBlockAppender();
			await page.keyboard.type( textWithWhitespace );

			// Use arrow keys to select only the text with the leading
			// and trailing whitespace.
			for ( let index = 0; index < textToSelect.length; index++ ) {
				await pressKeyWithModifier( 'shift', 'ArrowLeft' );
			}

			// Click on the Link button.
			await page.click( 'button[aria-label="Link"]' );

			// Wait for the URL field to auto-focus.
			await waitForURLFieldAutoFocus();

			// Type a URL.
			await page.keyboard.type( 'https://wordpress.org/gutenberg' );

			// Click on the Submit button.
			await page.keyboard.press( 'Enter' );

			// Reselect the link.
			await page.keyboard.press( 'ArrowLeft' );

			await showBlockToolbar();

			const [ editButton ] = await page.$x(
				'//button[contains(@aria-label, "Edit")]'
			);

			await editButton.click();

			await waitForURLFieldAutoFocus();

			await pressKeyWithModifier( 'shift', 'Tab' );

			// Tabbing back should land us in the text input.
			const textInputValue = await page.evaluate(
				() => document.activeElement.value
			);

			expect( textInputValue ).toBe( textToSelect );
		} );

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

			// Tabbing back should land us in the text input.
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
			const actualLinkText = await page.evaluate(
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

			// Move focus back to RichText for the underlying link.
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Tab' );

			// Make a selection within the RichText.
			await pressKeyWithModifier( 'shift', 'ArrowRight' );
			await pressKeyWithModifier( 'shift', 'ArrowRight' );
			await pressKeyWithModifier( 'shift', 'ArrowRight' );

			// Move back to the text input.
			await page.keyboard.press( 'Tab' );

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
	} );
} );
