/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'RichText (@firefox, @webkit)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should handle change in tag name gracefully', async ( {
		page,
		editor,
	} ) => {
		// Regression test: The heading block changes the tag name of its
		// RichText element. Historically this has been prone to breakage,
		// because the Editable component prevents rerenders, so React cannot
		// update the element by itself.
		//
		// See: https://github.com/WordPress/gutenberg/issues/3091
		await editor.insertBlock( { name: 'core/heading' } );
		await editor.clickBlockToolbarButton( 'Change level' );
		await page.locator( 'role=menuitemradio[name="Heading 3"]' ).click();

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: { level: 3 },
			},
		] );
	} );

	test( 'should apply formatting with primary shortcut', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'test' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+b' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '<strong>test</strong>' },
			},
		] );
	} );

	test( 'should apply formatting when selection is collapsed', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Some ' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( 'bold' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '.' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Some <strong>bold</strong>.' },
			},
		] );
	} );

	test( 'should apply multiple formats when selection is collapsed', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await pageUtils.pressKeys( 'primary+b' );
		await pageUtils.pressKeys( 'primary+i' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'primary+i' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '.' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '<strong><em>1</em></strong>.' },
			},
		] );
	} );

	test( 'should not highlight more than one format', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( ' 2' );
		await pageUtils.pressKeys( 'shift+ArrowLeft' );
		await pageUtils.pressKeys( 'primary+b' );

		const count = await editor.canvas
			.locator( ':root' )
			.evaluate(
				() =>
					document.querySelectorAll(
						'*[data-rich-text-format-boundary]'
					).length
			);
		expect( count ).toBe( 1 );
	} );

	test( 'should return focus when pressing formatting button', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Some ' );
		await editor.clickBlockToolbarButton( 'Bold' );
		await page.keyboard.type( 'bold' );
		await editor.clickBlockToolbarButton( 'Bold' );
		await page.keyboard.type( '.' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Some <strong>bold</strong>.' },
			},
		] );
	} );

	test( 'should transform backtick to code', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'A `backtick`' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'A <code>backtick</code>' },
			},
		] );

		await pageUtils.pressKeys( 'primary+z' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{ name: 'core/paragraph' },
		] );
	} );

	test( 'should undo backtick transform with backspace', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '`a`' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '`a`' },
			},
		] );
	} );

	test( 'should not undo backtick transform with backspace after typing', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '`a`' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [] );
	} );

	test( 'should not undo backtick transform with backspace after selection change', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '`a`' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		// Move inside format boundary.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [] );
	} );

	test( 'should not format text after code backtick', async ( {
		page,
		editor,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'A `backtick` and more.' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'A <code>backtick</code> and more.' },
			},
		] );
	} );

	test( 'should transform when typing backtick over selection', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'A selection test.' );
		await page.keyboard.press( 'Home' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await pageUtils.pressKeys( 'shiftAlt+ArrowRight' );
		await page.keyboard.type( '`' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'A <code>selection</code> test.' },
			},
		] );

		await pageUtils.pressKeys( 'primary+z' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'A `selection` test.' },
			},
		] );
	} );

	test( 'should only mutate text data on input', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '3' );

		await editor.canvas.locator( ':root' ).evaluate( () => {
			let called;
			const { body } = document;
			const config = {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true,
			};

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

		await editor.canvas.locator( ':root' ).evaluate( () => {
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

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1<strong>2</strong>34' },
			},
		] );
	} );

	test( 'should not lose selection direction', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'primary+b' );
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

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '<strong>1</strong>2-3' },
			},
		] );
	} );

	test( 'should handle Home and End keys', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '12' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.press( 'Home' );
		await page.keyboard.type( '-' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '+' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '-<strong>12</strong>+' },
			},
		] );
	} );

	test( 'should update internal selection after fresh focus', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Tab' );
		await pageUtils.pressKeys( 'shift+Tab' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeys( 'primary+b' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1<strong>2</strong>' },
			},
		] );
	} );

	test( 'should keep internal selection after blur (-webkit)', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1' );
		// Simulate moving focus to a different app, then moving focus back,
		// without selection being changed.
		await editor.canvas.locator( ':root' ).evaluate( () => {
			const activeElement = document.activeElement;
			activeElement.blur();
			activeElement.focus();
		} );
		// Wait for the next animation frame, see the focus event listener in
		// RichText.
		await page.evaluate(
			() => new Promise( window.requestAnimationFrame )
		);
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeys( 'primary+b' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1<strong>2</strong>' },
			},
		] );
	} );

	test( 'should split rich text on paste', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+x' );
		await page.keyboard.type( 'ab' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'a1' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '2b' },
			},
		] );
	} );

	test( 'should not split rich text on inline paste', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '2' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+x' );
		await page.keyboard.type( '13' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '123' },
			},
		] );
	} );

	test( 'should not split rich text on inline paste with formatting', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '3' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+x' );
		await page.keyboard.type( 'ab' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'a1<strong>2</strong>3b' },
			},
		] );
	} );

	test( 'should make bold after split and merge', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Backspace' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '2' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1<strong>2</strong>' },
			},
		] );
	} );

	test( 'should apply active formatting for inline paste', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '1' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '3' );
		await pageUtils.pressKeys( 'shift+ArrowLeft' );
		await pageUtils.pressKeys( 'primary+c' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '<strong>132</strong>3' },
			},
		] );
	} );

	// For some reason, tabbing in the highlight popover doesn't work in WebKit.
	test( 'should preserve internal formatting (-webkit, -firefox)', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();

		// Add text and select to color.
		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'primary+a' );
		await editor.clickBlockToolbarButton( 'More' );
		await page.locator( 'button:text("Highlight")' ).click();

		// Initial focus is on the "Text" tab.
		// Tab to the "Custom color picker".
		await page.keyboard.press( 'Tab' );
		// Tab to black.
		await page.keyboard.press( 'Tab' );
		// Select color other than black.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Enter' );

		const result = {
			name: 'core/paragraph',
			attributes: {
				content:
					'<mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-cyan-bluish-gray-color">1</mark>',
			},
		};

		expect( await editor.getBlocks() ).toMatchObject( [ result ] );

		// Dismiss color picker popover.
		await page.keyboard.press( 'Escape' );

		// Navigate to the block.
		await page.keyboard.press( 'Tab' );

		// Copy the colored text.
		await pageUtils.pressKeys( 'primary+c' );

		// Collapse the selection to the end.
		await page.keyboard.press( 'ArrowRight' );

		// Create a new paragraph.
		await page.keyboard.press( 'Enter' );

		// Paste the colored text.
		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getBlocks() ).toMatchObject(
			Array( 2 ).fill( result )
		);
	} );

	test( 'should paste paragraph contents into list', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		// Create two lines of text in a paragraph.
		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await page.keyboard.type( '2' );

		// Select all and copy.
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+c' );

		// Collapse the selection to the end.
		await page.keyboard.press( 'ArrowRight' );

		// Create a list.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '* ' );

		// Paste paragraph contents.
		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1<br>2' },
			},
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: '1<br>2' },
					},
				],
			},
		] );
	} );

	test( 'should paste list contents into paragraph', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();

		// Create an indented list of two lines.
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' 2' );

		// Select all text.
		await pageUtils.pressKeys( 'primary+a' );
		// Select the nested list.
		await pageUtils.pressKeys( 'primary+a' );
		// Select the parent list item.
		await pageUtils.pressKeys( 'primary+a' );
		// Select all the parent list item text.
		await pageUtils.pressKeys( 'primary+a' );
		// Select the entire list.
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+c' );

		await page.keyboard.press( 'Enter' );

		// Paste paragraph contents.
		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getBlocks() ).toMatchObject(
			Array( 2 ).fill( {
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: '1' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: '2' },
									},
								],
							},
						],
					},
				],
			} )
		);
	} );

	test( 'should navigate arround emoji', async ( { page, editor } ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '🍓' );
		// Only one press on arrow left should be required to move in front of
		// the emoji.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '1' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1🍓' },
			},
		] );
	} );

	test( 'should run input rules after composition end', async ( {
		editor,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		// Playwright doesn't support composition, so emulate it by inserting
		// text in the DOM directly, setting selection in the right place, and
		// firing `compositionend`.
		// See https://github.com/puppeteer/puppeteer/issues/4981.
		await editor.canvas.locator( ':root' ).evaluate( async () => {
			document.activeElement.textContent = '`a`';
			const selection = window.getSelection();
			// The `selectionchange` and `compositionend` events should run in separate event
			// loop ticks to process all data store updates in time. Native events would be
			// scheduled the same way.
			selection.selectAllChildren( document.activeElement );
			selection.collapseToEnd();
			await new Promise( ( r ) => setTimeout( r, 0 ) );
			document.activeElement.dispatchEvent(
				new CompositionEvent( 'compositionend' )
			);
		} );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '<code>a</code>' },
			},
		] );
	} );

	test( 'should navigate consecutive format boundaries', async ( {
		page,
		editor,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '1' );
		await pageUtils.pressKeys( 'primary+b' );
		await pageUtils.pressKeys( 'primary+i' );
		await page.keyboard.type( '2' );
		await pageUtils.pressKeys( 'primary+i' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '<strong>1</strong><em>2</em>' },
			},
		] );

		// Should move into the second format.
		await page.keyboard.press( 'ArrowLeft' );
		// Should move to the start of the second format.
		await page.keyboard.press( 'ArrowLeft' );
		// Should move between the first and second format.
		await page.keyboard.press( 'ArrowLeft' );

		await page.keyboard.type( '-' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '<strong>1</strong>-<em>2</em>' },
			},
		] );
	} );
} );
