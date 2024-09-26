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
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'Copy - collapsed selection' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+c' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'ArrowDown' );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should cut and paste individual blocks with collapsed selection', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// To do: run with iframe.
		await editor.switchToLegacyCanvas();

		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( 'Cut - collapsed selection' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+x' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await pageUtils.pressKeys( 'Tab' );
		await page.keyboard.press( 'ArrowDown' );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should copy blocks when non textual elements are focused  (image, spacer)', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/spacer' } );
		// At this point the spacer wrapper should be focused.
		await pageUtils.pressKeys( 'primary+c' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		// The block appender is only visible when there's no selection.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should cut and paste individual non textual blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/spacer' } );
		// At this point the spacer wrapper should be focused.
		await pageUtils.pressKeys( 'primary+x' );
		expect( await editor.getEditedPostContent() ).toBe( '' );

		// The block appender is only visible when there's no selection.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should respect inline copy when text is selected', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();

		await page.keyboard.type( 'First block' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second block' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'shift+ArrowLeft' );
		await pageUtils.pressKeys( 'shift+ArrowLeft' );

		await pageUtils.pressKeys( 'primary+c' );
		await page.keyboard.press( 'ArrowRight' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should respect inline copy in places like input fields and textareas', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/shortcode' } );
		await page.keyboard.type( '[my-shortcode]' );
		await pageUtils.pressKeys( 'shift+ArrowLeft' );
		await pageUtils.pressKeys( 'shift+ArrowLeft' );

		await pageUtils.pressKeys( 'primary+c' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'Pasted: ' );
		await pageUtils.pressKeys( 'primary+v' );
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
		await pageUtils.pressKeys( 'primary+x' );
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
		await pageUtils.pressKeys( 'primary+v' );

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
		await pageUtils.pressKeys( 'primary+x' );
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

		await pageUtils.pressKeys( 'primary+v' );

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
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'A block' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'B block' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from both blocks.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await pageUtils.pressKeys( 'primary+c' );
		await pageUtils.pressKeys( 'primary+ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await expect
			.poll( async () =>
				editor.canvas
					.locator( ':root' )
					.evaluate( () => window.getSelection().type )
			)
			.toBe( 'Caret' );
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should copy/paste partial selection with other blocks in-between', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'A block' );
		await editor.insertBlock( { name: 'core/spacer' } );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'B block' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from outer blocks.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await pageUtils.pressKeys( 'primary+c' );
		await pageUtils.pressKeys( 'primary+ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await expect
			.poll( async () =>
				editor.canvas
					.locator( ':root' )
					.evaluate( () => window.getSelection().type )
			)
			.toBe( 'Caret' );
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should cut partial selection of text blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'A block' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'B block' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from both blocks.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await pageUtils.pressKeys( 'primary+x' );
		await pageUtils.pressKeys( 'primary+ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await expect
			.poll( async () =>
				editor.canvas
					.locator( ':root' )
					.evaluate( () => window.getSelection().type )
			)
			.toBe( 'Caret' );
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should cut/paste partial selection with other blocks in-between', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'A block' );
		await editor.insertBlock( { name: 'core/spacer' } );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'B block' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
		// Partial select from outer blocks.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 5 } );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await pageUtils.pressKeys( 'primary+x' );
		await pageUtils.pressKeys( 'primary+ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await expect
			.poll( async () =>
				editor.canvas
					.locator( ':root' )
					.evaluate( () => window.getSelection().type )
			)
			.toBe( 'Caret' );
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+v' );
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
		await pageUtils.pressKeys( 'ArrowLeft', { times: 2 } );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await pageUtils.pressKeys( 'primary+x' );
		await pageUtils.pressKeys( 'primary+ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await expect
			.poll( async () =>
				editor.canvas
					.locator( ':root' )
					.evaluate( () => window.getSelection().type )
			)
			.toBe( 'Caret' );
		// Create a new block at the top of the document to paste there.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeys( 'primary+v' );
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
		await pageUtils.pressKeys( 'ArrowLeft', { times: 2 } );
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await pageUtils.pressKeys( 'primary+c' );
		await pageUtils.pressKeys( 'primary+ArrowLeft' );
		// Sometimes the caret has not moved to the correct position before pressing Enter.
		// @see https://github.com/WordPress/gutenberg/issues/40303#issuecomment-1109434887
		await expect
			.poll( async () =>
				editor.canvas
					.locator( ':root' )
					.evaluate( () => window.getSelection().type )
			)
			.toBe( 'Caret' );
		// Create a new code block to paste there.
		await editor.insertBlock( { name: 'core/code' } );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should paste single line in post title', async ( {
		pageUtils,
		editor,
	} ) => {
		// This test checks whether we are correctly handling single line
		// pasting in the post title. Previously we were accidentally falling
		// back to default browser behaviour, allowing the browser to insert
		// unfiltered HTML. When we swap out the post title in the post editor
		// with the proper block, this test can be removed.
		pageUtils.setClipboardData( {
			html: '<span style="border: 1px solid black">Hello World</span>',
		} );
		await pageUtils.pressKeys( 'primary+v' );
		// Expect the span to be filtered out.
		expect(
			await editor.canvas
				.locator( ':root' )
				.evaluate( () => document.activeElement.innerHTML )
		).toMatchSnapshot();
	} );

	test( 'should paste single line in post title with existing content', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		await page.keyboard.type( 'ab' );
		await page.keyboard.press( 'ArrowLeft' );
		pageUtils.setClipboardData( {
			html: '<span style="border: 1px solid black">x</span>',
		} );
		await pageUtils.pressKeys( 'primary+v' );
		// Ensure the selection is correct.
		await page.keyboard.type( 'y' );
		expect(
			await editor.canvas
				.locator( ':root' )
				.evaluate( () => document.activeElement.innerHTML )
		).toBe( 'axyb' );
	} );

	test( 'should paste preformatted in list', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		pageUtils.setClipboardData( {
			html: '<pre>x</pre>',
			plainText: 'x',
		} );
		await editor.insertBlock( { name: 'core/list' } );
		await pageUtils.pressKeys( 'primary+v' );
		// Ensure the selection is correct.
		await page.keyboard.type( 'y' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should paste list in list', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		pageUtils.setClipboardData( { html: '<ul><li>x</li><li>y</li></ul>' } );
		await editor.insertBlock( { name: 'core/list' } );
		await pageUtils.pressKeys( 'primary+v' );
		// Ensure the selection is correct.
		await page.keyboard.type( '‸' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should paste paragraphs in list', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		pageUtils.setClipboardData( { html: '<p>x</p><p>y</p>' } );
		await editor.insertBlock( { name: 'core/list' } );
		await pageUtils.pressKeys( 'primary+v' );
		// Ensure the selection is correct.
		await page.keyboard.type( '‸' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should link selection', async ( { pageUtils, editor } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await pageUtils.pressKeys( 'primary+a' );
		pageUtils.setClipboardData( {
			plainText: 'https://wordpress.org/gutenberg',
			html: '<a href="https://wordpress.org/gutenberg">https://wordpress.org/gutenberg</a>',
		} );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: '<a href="https://wordpress.org/gutenberg">a</a>',
				},
			},
		] );
	} );

	test( 'should link selection on internal paste', async ( {
		pageUtils,
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'https://w.org' },
		} );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+x' );
		await page.keyboard.type( 'a' );
		await pageUtils.pressKeys( 'shift+ArrowLeft' );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: '<a href="https://w.org">a</a>',
				},
			},
		] );
	} );

	test( 'should paste link to formatted text', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '<strong>test</strong>' },
		} );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await pageUtils.pressKeys( 'shift+ArrowRight' );
		await pageUtils.pressKeys( 'shift+ArrowRight' );
		pageUtils.setClipboardData( {
			plainText: 'https://wordpress.org/gutenberg',
			html: 'https://wordpress.org/gutenberg',
		} );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should auto-link', async ( { pageUtils, editor } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		pageUtils.setClipboardData( {
			plainText: 'https://wordpress.org/gutenberg',
			html: 'https://wordpress.org/gutenberg',
		} );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content:
						'<a href="https://wordpress.org/gutenberg">https://wordpress.org/gutenberg</a>a',
				},
			},
		] );
	} );

	test( 'should embed on paste', async ( { pageUtils, editor } ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		pageUtils.setClipboardData( {
			plainText: 'https://www.youtube.com/watch?v=FcTLMTyD2DU',
			html: 'https://www.youtube.com/watch?v=FcTLMTyD2DU',
		} );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getBlocks() ).toMatchObject( [
			{ name: 'core/embed' },
		] );
	} );

	test( 'should not link selection for non http(s) protocol', async ( {
		pageUtils,
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'a',
			},
		} );
		await pageUtils.pressKeys( 'primary+a' );
		pageUtils.setClipboardData( {
			plainText: 'movie: b',
			html: 'movie: b',
		} );
		await pageUtils.pressKeys( 'primary+v' );
		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'movie: b',
				},
			},
		] );
	} );

	test( 'should inherit existing block type on paste', async ( {
		pageUtils,
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: {
				content: 'A',
			},
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'b',
			},
		} );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+c' );

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '[]' );
		await page.keyboard.press( 'ArrowLeft' );

		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: '[A',
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'b]',
				},
			},
		] );
	} );

	// See https://github.com/WordPress/gutenberg/pull/61900
	test( 'should inherit heading attributes on paste split', async ( {
		pageUtils,
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: {
				content: 'AB',
			},
		} );
		await page.keyboard.press( 'ArrowRight' );

		pageUtils.setClipboardData( {
			html: '<p>a</p><p>b</p>',
		} );
		await pageUtils.pressKeys( 'primary+v' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: {
					content: 'Aa',
					level: 2,
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'bB',
				},
			},
		] );
	} );
} );
