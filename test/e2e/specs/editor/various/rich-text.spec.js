/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'RichText', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should handle change in tag name gracefully', async ( {
		editor,
		page,
	} ) => {
		// Regression test: The heading block changes the tag name of its
		// RichText element. Historically this has been prone to breakage,
		// because the Editable component prevents rerenders, so React cannot
		// update the element by itself.
		//
		// See: https://github.com/WordPress/gutenberg/issues/3091
		await editor.insertBlock( { name: 'core/heading' } );

		await page.click( '[aria-label="Change heading level"]' );
		await page.click( 'role=menuitemradio[name="Heading 3"i]' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should apply formatting with primary shortcut', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'test' );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should apply formatting when selection is collapsed', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Some ' );
		// All following characters should now be bold.
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( 'bold' );
		// All following characters should no longer be bold.
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '.' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should apply multiple formats when selection is collapsed', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await pageUtils.pressKeyWithModifier( 'primary', 'i' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeyWithModifier( 'primary', 'i' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '.' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not highlight more than one format', async ( {
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( ' 2' );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowLeft' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );

		const count = await page
			.locator( '*[data-rich-text-format-boundary]' )
			.count();
		expect( count ).toBe( 1 );
	} );

	test( 'should return focus when pressing formatting button', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Some ' );
		await editor.showBlockToolbar();
		await page.click( '[aria-label="Bold"]' );
		await page.keyboard.type( 'bold' );
		await editor.showBlockToolbar();
		await page.click( '[aria-label="Bold"]' );
		await page.keyboard.type( '.' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should transform backtick to code', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'A `backtick`' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await pageUtils.pressKeyWithModifier( 'primary', 'z' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should undo backtick transform with backspace', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '`a`' );
		await page.keyboard.press( 'Backspace' );

		// Expect "`a`" to be restored.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not undo backtick transform with backspace after typing', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '`a`' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Expect "a" to be deleted.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not undo backtick transform with backspace after selection change', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '`a`' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		// Move inside format boundary.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Backspace' );

		// Expect "a" to be deleted.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not format text after code backtick', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'A `backtick` and more.' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should only mutate text data on input', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '3' );

		await page.evaluate( () => {
			let called;
			const { body } = document;
			const config = {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true,
			};

			// eslint-disable-next-line no-undef
			const mutationObserver = new MutationObserver( ( records ) => {
				if ( called || records.length > 1 ) {
					throw new Error( 'Typing should only mutate once.' );
				}

				records.forEach( ( record ) => {
					if ( record.type !== 'characterData' ) {
						throw new Error(
							`Typing mutated more than character data: ${ record.type }`
						);
					}
				} );

				called = true;
			} );

			mutationObserver.observe( body, config );

			window.unsubscribes = [ () => mutationObserver.disconnect() ];

			document.addEventListener(
				'selectionchange',
				() => {
					function throwMultipleSelectionChange() {
						throw new Error(
							'Typing should only emit one selection change event.'
						);
					}

					document.addEventListener(
						'selectionchange',
						throwMultipleSelectionChange,
						{
							once: true,
						}
					);

					window.unsubscribes.push( () => {
						document.removeEventListener(
							'selectionchange',
							throwMultipleSelectionChange
						);
					} );
				},
				{ once: true }
			);
		} );

		await page.keyboard.type( '4' );

		await page.evaluate( () => {
			// The selection change event should be called once. If there's only
			// one item in `window.unsubscribes`, it means that only one
			// function is present to disconnect the `mutationObserver`.
			if ( window.unsubscribes.length === 1 ) {
				throw new Error(
					'The selection change event listener was never called.'
				);
			}

			window.unsubscribes.forEach( ( unsubscribe ) => unsubscribe() );
		} );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not lose selection direction', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '23' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.up( 'Shift' );

		// There should be no selection. The following should insert "-" without
		// deleting the numbers.
		await page.keyboard.type( '-' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should handle Home and End keys', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );

		// Wait for rich text editor to load.
		await page.waitForSelector( '.block-editor-rich-text__editable' );

		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '12' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );

		await page.keyboard.press( 'Home' );
		await page.keyboard.type( '-' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '+' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should update internal selection after fresh focus', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Tab' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Tab' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should keep internal selection after blur', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
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
		await page.evaluate(
			() => new Promise( window.requestAnimationFrame )
		);
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should split rich text on paste', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		await page.keyboard.type( 'ab' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not split rich text on inline paste', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		await page.keyboard.type( '13' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should not split rich text on inline paste with formatting', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '3' );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		await page.keyboard.type( 'ab' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should make bold after split and merge', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Backspace' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '2' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should apply active formatting for inline paste', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '1' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '3' );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowLeft' );
		await pageUtils.pressKeyWithModifier( 'primary', 'c' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should preserve internal formatting', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		// Add text and select to color.
		await page.keyboard.type( '1' );
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await editor.clickBlockToolbarButton( 'More' );

		const button = page.locator( 'text=Highlight' );

		// Clicks may fail if the button is out of view. Assure it is before click.
		await button.evaluate( ( element ) => element.scrollIntoView() );
		await button.click();

		// Tab to the "Text" tab.
		await page.keyboard.press( 'Tab' );
		// Tab to black.
		await page.keyboard.press( 'Tab' );
		// Select color other than black.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// Dismiss color picker popover.
		await page.keyboard.press( 'Escape' );

		// Navigate to the block.
		await page.keyboard.press( 'Tab' );

		// Copy the colored text.
		await pageUtils.pressKeyWithModifier( 'primary', 'c' );

		// Collapse the selection to the end.
		await page.keyboard.press( 'ArrowRight' );

		// Create a new paragraph.
		await page.keyboard.press( 'Enter' );

		// Paste the colored text.
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should paste paragraph contents into list', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );

		// Create two lines of text in a paragraph.
		await page.keyboard.type( '1' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '2' );

		// Select all and copy.
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await pageUtils.pressKeyWithModifier( 'primary', 'c' );

		// Collapse the selection to the end.
		await page.keyboard.press( 'ArrowRight' );

		// Create a list.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '* ' );

		// Paste paragraph contents.
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should paste list contents into paragraph', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );

		// Create an indented list of two lines.
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' 2' );

		// Select all and copy.
		await pageUtils.pressKeyWithModifier( 'primary', 'a' );
		await pageUtils.pressKeyWithModifier( 'primary', 'c' );

		// Collapse the selection to the end.
		await page.keyboard.press( 'ArrowRight' );

		// Create a paragraph.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		// Paste paragraph contents.
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should navigate arround emoji', async ( { editor, page } ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '🍓' );
		// Only one press on arrow left should be required to move in front of
		// the emoji.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '1' );

		// Expect '1🍓'.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should run input rules after composition end', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		// Puppeteer doesn't support composition, so emulate it by inserting
		// text in the DOM directly, setting selection in the right place, and
		// firing `compositionend`.
		// See https://github.com/puppeteer/puppeteer/issues/4981.
		await page.evaluate( () => {
			document.activeElement.textContent = '`a`';
			const selection = window.getSelection();
			selection.selectAllChildren( document.activeElement );
			selection.collapseToEnd();
			document.activeElement.dispatchEvent(
				// eslint-disable-next-line no-undef
				new CompositionEvent( 'compositionend' )
			);
		} );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should navigate consecutive format boundaries', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await pageUtils.pressKeyWithModifier( 'primary', 'i' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeyWithModifier( 'primary', 'i' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// Should move into the second format.
		await page.keyboard.press( 'ArrowLeft' );
		// Should move to the start of the second format.
		await page.keyboard.press( 'ArrowLeft' );
		// Should move between the first and second format.
		await page.keyboard.press( 'ArrowLeft' );

		await page.keyboard.type( '-' );

		// Expect: <strong>1</strong>-<em>2</em>
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
