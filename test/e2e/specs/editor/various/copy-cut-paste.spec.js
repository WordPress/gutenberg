/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Copy/cut/paste', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should copy and paste individual blocks with collapsed selection', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Copy - collapsed selection' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'c' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'ArrowDown' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should cut and paste individual blocks with collapsed selection', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Cut - collapsed selection' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'ArrowDown' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should copy blocks when non textual elements are focused  (image, spacer)', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/spacer' } );
		// At this point the spacer wrapper should be focused.
		await pageUtils.pressKeyWithModifier( 'primary', 'c' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// The block appender is only visible when there's no selection.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );
		await page.click( 'role=button[name="Add default block"i]' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should cut and paste individual non textual blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/spacer' } );
		// At this point the spacer wrapper should be focused.
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		expect( await editor.getEditedPostContent() ).toBe( '' );

		// The block appender is only visible when there's no selection.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );
		await page.click( 'role=button[name="Add default block"i]' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should respect inline copy when text is selected', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );

		await page.keyboard.type( 'First block' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second block' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowLeft' );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowLeft' );

		await pageUtils.pressKeyWithModifier( 'primary', 'c' );
		await page.keyboard.press( 'ArrowRight' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should respect inline copy in places like input fields and textareas', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/shortcode' } );
		await page.keyboard.type( '[my-shortcode]' );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowLeft' );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowLeft' );

		await pageUtils.pressKeyWithModifier( 'primary', 'c' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Pasted: ' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should handle paste events once', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add group block with paragraph.
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: { text: 'Click' },
				},
			],
		} );
		// Cut group.
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		expect( await editor.getEditedPostContent() ).toBe( '' );

		await page.keyboard.press( 'Enter' );

		await page.evaluate( () => {
			window.e2eTestPasteOnce = [];
			let oldBlocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			window.wp.data.subscribe( () => {
				const blocks = window.wp.data
					.select( 'core/block-editor' )
					.getBlocks();
				if ( blocks !== oldBlocks ) {
					window.e2eTestPasteOnce.push(
						blocks.map( ( { clientId, name } ) => ( {
							clientId,
							name,
						} ) )
					);
				}
				oldBlocks = blocks;
			} );
		} );

		// Paste.
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		// Blocks should only be modified once, not twice with new clientIds on a single paste action.
		const blocksUpdated = await page.evaluate(
			() => window.e2eTestPasteOnce
		);

		expect( blocksUpdated.length ).toEqual( 1 );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can copy group onto non textual element (image, spacer)', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add group block with paragraph.
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{
					name: 'core/button',
					attributes: { text: 'Click' },
				},
			],
		} );
		// Cut group.
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		expect( await editor.getEditedPostContent() ).toBe( '' );

		// Insert a non textual element (a spacer)
		await editor.insertBlock( { name: 'core/spacer' } );
		// Spacer is focused.
		await page.evaluate( () => {
			window.e2eTestPasteOnce = [];
			let oldBlocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			window.wp.data.subscribe( () => {
				const blocks = window.wp.data
					.select( 'core/block-editor' )
					.getBlocks();
				if ( blocks !== oldBlocks ) {
					window.e2eTestPasteOnce.push(
						blocks.map( ( { clientId, name } ) => ( {
							clientId,
							name,
						} ) )
					);
				}
				oldBlocks = blocks;
			} );
		} );

		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		// Paste should be handled on non-textual elements and only handled once.
		const blocksUpdated = await page.evaluate(
			() => window.e2eTestPasteOnce
		);

		expect( blocksUpdated.length ).toEqual( 1 );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should copy only partial selection of text blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'A block' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'B block' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from both blocks.
		await pageUtils.pressKeyTimes( 'ArrowLeft', 5 );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'c' );
		await pageUtils.pressKeyWithModifier( 'primary', 'ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await page.waitForFunction(
			() => window.getSelection().type === 'Caret'
		);
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should copy/paste partial selection with other blocks in-between', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'A block' );
		await editor.insertBlock( { name: 'core/spacer' } );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'B block' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from outer blocks.
		await pageUtils.pressKeyTimes( 'ArrowLeft', 5 );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'c' );
		await pageUtils.pressKeyWithModifier( 'primary', 'ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await page.waitForFunction(
			() => window.getSelection().type === 'Caret'
		);
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should cut partial selection of text blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'A block' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'B block' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from both blocks.
		await pageUtils.pressKeyTimes( 'ArrowLeft', 5 );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		await pageUtils.pressKeyWithModifier( 'primary', 'ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await page.waitForFunction(
			() => window.getSelection().type === 'Caret'
		);
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should cut/paste partial selection with other blocks in-between', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'A block' );
		await editor.insertBlock( { name: 'core/spacer' } );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'B block' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from outer blocks.
		await pageUtils.pressKeyTimes( 'ArrowLeft', 5 );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		await pageUtils.pressKeyWithModifier( 'primary', 'ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await page.waitForFunction(
			() => window.getSelection().type === 'Caret'
		);
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should cut partial selection and merge like a normal `delete` - not forward ', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/heading' } );
		await page.keyboard.type( 'Heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Paragraph' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from outer blocks.
		await pageUtils.pressKeyTimes( 'ArrowLeft', 2 );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'x' );
		await pageUtils.pressKeyWithModifier( 'primary', 'ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await page.waitForFunction(
			() => window.getSelection().type === 'Caret'
		);
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should paste plain text in plain text context when cross block selection is copied ', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/heading' } );
		await page.keyboard.type( 'Heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Paragraph' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from outer blocks.
		await pageUtils.pressKeyTimes( 'ArrowLeft', 2 );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primary', 'c' );
		await pageUtils.pressKeyWithModifier( 'primary', 'ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await page.waitForFunction(
			() => window.getSelection().type === 'Caret'
		);
		// Create a new code block to paste there.
		await editor.insertBlock( { name: 'core/code' } );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should paste single line in post title', async ( {
		page,
		pageUtils,
	} ) => {
		// This test checks whether we are correctly handling single line
		// pasting in the post title. Previously we were accidentally falling
		// back to default browser behaviour, allowing the browser to insert
		// unfiltered HTML. When we swap out the post title in the post editor
		// with the proper block, this test can be removed.
		await pageUtils.setClipboardData( {
			html: '<span style="border: 1px solid black">Hello World</span>',
		} );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		// Expect the span to be filtered out.
		expect(
			await page.evaluate( () => document.activeElement.innerHTML )
		).toMatchSnapshot();
	} );

	test( 'should paste single line in post title with existing content', async ( {
		page,
		pageUtils,
	} ) => {
		await page.keyboard.type( 'ab' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.setClipboardData( {
			html: '<span style="border: 1px solid black">x</span>',
		} );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		// Ensure the selection is correct.
		await page.keyboard.type( 'y' );
		expect(
			await page.evaluate( () => document.activeElement.innerHTML )
		).toBe( 'axyb' );
	} );

	test( 'should paste preformatted in list', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		await pageUtils.setClipboardData( {
			html: '<pre>x</pre>',
		} );
		await editor.insertBlock( { name: 'core/list' } );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );
		// Ensure the selection is correct.
		await page.keyboard.type( 'y' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
