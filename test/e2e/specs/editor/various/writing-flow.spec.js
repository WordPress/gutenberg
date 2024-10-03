/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	writingFlowUtils: async ( { page, editor }, use ) => {
		await use( new WritingFlowUtils( { page, editor } ) );
	},
} );

test.describe( 'Writing Flow (@firefox, @webkit)', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'Should navigate inner blocks with arrow keys', async ( {
		editor,
		page,
		writingFlowUtils,
	} ) => {
		// Assertions are made both against the active DOM element and the
		// editor state, in order to protect against potential disparities.
		//
		// See: https://github.com/WordPress/gutenberg/issues/18928
		await writingFlowUtils.addDemoContent();

		const activeElementLocator = editor.canvas.locator( ':focus' );

		// Arrow up into nested context focuses last text input.
		await page.keyboard.press( 'ArrowUp' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/paragraph' );
		await expect( activeElementLocator ).toBeFocused();
		await expect( activeElementLocator ).toHaveText( '2nd col' );

		// Arrow up in inner blocks should navigate through (1) column wrapper,
		// (2) text fields.
		await page.keyboard.press( 'ArrowUp' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/column' );
		await page.keyboard.press( 'ArrowUp' );
		const activeElementBlockType = await editor.canvas
			.locator( ':root' )
			.evaluate( () =>
				document.activeElement.getAttribute( 'data-type' )
			);
		expect( activeElementBlockType ).toBe( 'core/columns' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/columns' );

		// Arrow up from focused (columns) block wrapper exits nested context
		// to prior text input.
		await page.keyboard.press( 'ArrowUp' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/paragraph' );
		await expect( activeElementLocator ).toBeFocused();
		await expect( activeElementLocator ).toHaveText( 'First paragraph' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'First paragraph' },
			},
			{
				name: 'core/columns',
				attributes: {},
				innerBlocks: [
					{
						name: 'core/column',
						attributes: {},
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: '1st col' },
							},
						],
					},
					{
						name: 'core/column',
						attributes: {},
						innerBlocks: [
							{
								name: 'core/paragraph',
								attributes: { content: '2nd col' },
							},
						],
					},
				],
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'Second paragraph' },
			},
		] );
	} );

	test( 'should navigate around inline boundaries', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Add demo content.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'First' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Third' );

		// Navigate to second paragraph.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 6 } );

		// Bold second paragraph text.
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 6 } );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeys( 'primary+b' );

		// Arrow left from selected bold should collapse to before the inline
		// boundary. Arrow once more to traverse into first paragraph.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( 'After' );

		// Arrow right from end of first should traverse to second, *BEFORE*
		// the bolded text. Another press should move within inline boundary.
		await pageUtils.pressKeys( 'ArrowRight', { times: 2 } );
		await page.keyboard.type( 'Inside' );

		// Arrow left from end of beginning of inline boundary should move to
		// the outside of the inline boundary.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 6 } );
		await page.keyboard.press( 'ArrowLeft' ); // Separate for emphasis.
		await page.keyboard.type( 'Before' );

		// Likewise, test at the end of the inline boundary for same effect.
		await page.keyboard.press( 'ArrowRight' ); // Move inside
		await pageUtils.pressKeys( 'ArrowRight', { times: 12 } );
		await page.keyboard.type( 'Inside' );
		await page.keyboard.press( 'ArrowRight' );

		// Edge case: Verify that workaround to test for ZWSP at beginning of
		// focus node does not take effect when on the right edge of inline
		// boundary (thus preventing traversing to the next block by arrow).
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowLeft' );

		// Should be after the inline boundary again.
		await page.keyboard.type( 'After' );

		// Finally, ensure that ArrowRight from end of unbolded text moves to
		// the last paragraph.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'Before' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'FirstAfter' },
			},
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Before<strong>InsideSecondInside</strong>After',
				},
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'BeforeThird' },
			},
		] );
	} );

	test( 'should navigate around nested inline boundaries', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'primary+b' );
		await page.keyboard.type( '1 2' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeys( 'primary+i' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeys( 'primary+i' );
		await page.keyboard.press( 'ArrowLeft' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p><strong><em>1</em> <em>2</em></strong></p>
<!-- /wp:paragraph -->` );

		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'c' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'd' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'e' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'f' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'g' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'h' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'i' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'j' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>a<strong>b<em>c1d</em>e f<em>g2h</em>i</strong>j</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should insert line break at end', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>a<br></p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should insert line break at end and continue writing', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await page.keyboard.type( 'b' );
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>a<br>b</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should insert line break mid text', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'ab' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>a<br>b</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should insert line break at start', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p><br>a</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should insert line break in empty container', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p><br></p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should not create extra line breaks in multiline value', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getEditedPostContent ).toBe( `<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );
	} );

	// See: https://github.com/WordPress/gutenberg/issues/9626
	test( 'should navigate native inputs vertically, not horizontally', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/shortcode' } );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.type( 'abc' ); // Need content to remove placeholder label.
		await editor.selectBlocks(
			editor.canvas.locator( 'role=document[name="Block: Shortcode"i]' )
		);

		// Should remain in title upon ArrowRight:
		await page.keyboard.press( 'ArrowRight' );
		await expect(
			editor.canvas.locator( 'role=document[name="Block: Shortcode"i]' )
		).toHaveClass( /is-selected/ );

		// Should remain in title upon modifier + ArrowDown:
		await pageUtils.pressKeys( 'primary+ArrowDown' );
		await expect(
			editor.canvas.locator( 'role=document[name="Block: Shortcode"i]' )
		).toHaveClass( /is-selected/ );

		// Should navigate to the next block.
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			editor.canvas.locator( 'role=document[name="Block: Paragraph"i]' )
		).toHaveClass( /is-selected/ );
	} );

	test( 'should not delete surrounding space when deleting a word with Backspace', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1 2 3' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: ' 3'.length } );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>1  3</p>
<!-- /wp:paragraph -->` );

		await page.keyboard.type( '2' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>1 2 3</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should not delete surrounding space when deleting a word with Alt+Backspace', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'alpha beta gamma' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: ' gamma'.length } );

		await pageUtils.pressKeys(
			`${ process.platform === 'darwin' ? 'Alt' : 'primary' }+Backspace`
		);

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>alpha  gamma</p>
<!-- /wp:paragraph -->` );

		await page.keyboard.type( 'beta' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>alpha beta gamma</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should not delete surrounding space when deleting a selected word', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'alpha beta gamma' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: ' gamma'.length } );
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 'beta'.length } );
		await page.keyboard.up( 'Shift' );

		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>alpha  gamma</p>
<!-- /wp:paragraph -->` );

		await page.keyboard.type( 'beta' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>alpha beta gamma</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should create valid paragraph blocks when rapidly pressing Enter', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'Enter', { times: 10 } );

		// Check that none of the paragraph blocks have <br> in them.
		expect( await editor.getBlocks() ).toMatchObject(
			Array( 11 ).fill( {
				name: 'core/paragraph',
				attributes: { content: '' },
			} )
		);
	} );

	test( 'should navigate empty paragraphs', async ( { editor, page } ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '3' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '3' },
			},
		] );
	} );

	test( 'should navigate contenteditable with padding', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await editor.canvas.locator( ':root' ).evaluate( () => {
			document.activeElement.style.paddingTop = '100px';
		} );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '1' );
		await editor.canvas.locator( ':root' ).evaluate( () => {
			document.activeElement.style.paddingBottom = '100px';
		} );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( '2' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );
	} );

	test( 'should navigate contenteditable with normal line height', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await editor.canvas.locator( ':root' ).evaluate( () => {
			document.activeElement.style.lineHeight = 'normal';
		} );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '1' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '' },
			},
		] );
	} );

	test( 'should not prematurely multi-select', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '><<' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await page.keyboard.type( '<<<' );
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: '<<\n<<<'.length } );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '>' },
			},
		] );
	} );

	test( 'should remove first empty paragraph on Backspace', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );

		// Ensure setup is correct.
		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );

		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '2' },
			},
		] );
	} );

	test( 'should merge paragraphs', async ( { editor, page } ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>12</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should merge and then split paragraphs', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'abc' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '123' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>abc</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>123</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should merge and then soft line break', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.up( 'Shift' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>1<br>2</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should merge forwards', async ( { editor, page } ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Delete' );
		await page.keyboard.type( '2' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>123</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should merge forwards properly on multiple triggers', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await pageUtils.pressKeys( 'ArrowUp', { times: 2 } );
		await pageUtils.pressKeys( 'Delete', { times: 2 } );
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>3</p>
<!-- /wp:paragraph -->` );

		await page.keyboard.press( 'Delete' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>13</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should preserve horizontal position when navigating vertically between blocks (-webkit)', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'abc' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '23' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( '1' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>abc</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>123</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should remember initial vertical position', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( 'x' ); // Should be right after "1".

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>1x</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><br>2</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should navigate contenteditable with side padding', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await editor.canvas.locator( ':root' ).evaluate( () => {
			document.activeElement.style.paddingLeft = '100px';
		} );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '1' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '' },
			},
		] );
	} );

	test( 'should extend selection into paragraph for list with longer last item', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '* b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'cd' );

		// Selects part of the first list item, although invisible.
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		// Extends selection into the first paragraph
		await pageUtils.pressKeys( 'shift+ArrowUp' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		// Mixed selection, so all content will be removed.
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
	} );

	test( 'should not have a dead zone between blocks (lower)', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );

		const paragraphBlock = editor.canvas
			.locator( 'role=document[name="Block: Paragraph"i]' )
			.first();
		const paragraphRect = await paragraphBlock.boundingBox();
		const x = paragraphRect.x + ( 2 * paragraphRect.width ) / 3;
		const y = paragraphRect.y + paragraphRect.height + 1;

		// The typing observer requires two mouse moves to detect an actual
		// move.
		await page.mouse.move( x - 1, y - 1 );
		await page.mouse.move( x, y );

		const inserter = page.locator( 'role=button[name="Add block"i]' );
		await expect( inserter ).toBeVisible();

		const inserterRect = await inserter.boundingBox();
		const lowerInserterY = inserterRect.y + ( 2 * inserterRect.height ) / 3;

		await page.mouse.click( x, lowerInserterY );
		await page.keyboard.type( '3' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>23</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should not have a dead zone above an aligned block', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/image' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Align' );

		const wideButton = page.locator(
			'role=menuitemradio[name="Wide width"i]'
		);
		await wideButton.click();

		// Focus the block content
		await pageUtils.pressKeys( 'Tab' );

		// Select the previous block.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );

		// Confirm correct setup.
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->

<!-- wp:image {"align":"wide"} -->
<figure class="wp-block-image alignwide"><img alt=""/></figure>
<!-- /wp:image -->` );

		const paragraphBlock = editor.canvas.locator(
			'role=document[name="Block: Paragraph"i]'
		);

		// Find a point outside the paragraph between the blocks where it's
		// expected that the sibling inserter would be placed.
		const paragraphRect = await paragraphBlock.boundingBox();
		const x = paragraphRect.x + ( 2 * paragraphRect.width ) / 3;
		const y = paragraphRect.y + paragraphRect.height + 1;

		await page.mouse.move( x, y );

		const inserter = page.locator( 'role=button[name="Add block"i]' );
		await expect( inserter ).toBeVisible();

		// Find the space between the inserter and the image block.
		const inserterRect = await inserter.boundingBox();
		const lowerInserterY = inserterRect.y + ( 2 * inserterRect.height ) / 3;

		// Clicking that in-between space should select the image block.
		await page.mouse.click( x, lowerInserterY );

		await expect(
			editor.canvas.locator( 'role=document[name="Block: Image"i]' )
		).toHaveClass( /is-selected/ );
	} );

	test( 'should only consider the content as one tab stop', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/table' );
		await page.keyboard.press( 'Enter' );
		// Tab to the "Create table" button.
		await pageUtils.pressKeys( 'Tab' );
		await pageUtils.pressKeys( 'Tab' );
		// Create the table.
		await page.keyboard.press( 'Space' );
		await expect(
			editor.canvas.locator( 'role=document[name="Block: Table"i]' )
		).toBeVisible();
		// Navigate to the second cell.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '2' );
		// Confirm correct setup.
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:table -->
<figure class="wp-block-table"><table class="has-fixed-layout"><tbody><tr><td></td><td>2</td></tr><tr><td></td><td></td></tr></tbody></table></figure>
<!-- /wp:table -->` );
	} );

	// Checks for regressions of https://github.com/WordPress/gutenberg/issues/40091.
	test( 'does not deselect the block when selecting text outside the editor canvas', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Random Paragraph' );
		await editor.openDocumentSettingsSidebar();
		const blockDescription = page.locator(
			'.block-editor-block-card__description'
		);
		await expect( blockDescription ).toBeVisible();

		const boundingBox = await blockDescription.boundingBox();
		const startPosition = {
			x: boundingBox.x + 10,
			y: boundingBox.y + 8,
		};
		const endPosition = {
			x: startPosition.x + 50,
			y: startPosition.y,
		};

		await page.mouse.move( startPosition.x, startPosition.y );
		await page.mouse.down();
		await page.mouse.move( endPosition.x, endPosition.y );
		await page.mouse.up();

		await expect(
			editor.canvas.locator( 'role=document[name="Block: Paragraph"i]' )
		).toHaveClass( /is-selected/ );
	} );

	test( 'should prevent browser default formatting on multi selection', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'first' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'second' );

		// Multi select both paragraphs.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 2 } );
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 2 } );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeys( 'primary+b' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>first</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>second</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should move to the start of the first line on ArrowUp (-firefox)', async ( {
		page,
		editor,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );

		async function getHeight() {
			return await editor.canvas
				.locator( ':root' )
				.evaluate( () => document.activeElement.offsetHeight );
		}

		const height = await getHeight();

		// Keep typing until the height of the element increases. We need two
		// lines.
		while ( height === ( await getHeight() ) ) {
			await page.keyboard.type( 'a' );
		}

		// Move to the start of the second line.
		await page.keyboard.press( 'ArrowLeft' );
		// Move to the start of the first line.
		await page.keyboard.press( 'ArrowUp' );
		// Insert a "." for testing.
		await page.keyboard.type( '.' );

		// Expect the "." to be added at the start of the paragraph
		await expect(
			editor.canvas.locator( 'role=document[name="Block: Paragraph"i]' )
		).toHaveText( /^\.a+$/ );
	} );

	test( 'should vertically move the caret from corner to corner (-webkit)', async ( {
		page,
		editor,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );

		async function getHeight() {
			return await editor.canvas
				.locator( ':root' )
				.evaluate( () => document.activeElement.offsetHeight );
		}

		const height = await getHeight();

		// Keep typing until the height of the element increases. We need two
		// lines.
		while ( height === ( await getHeight() ) ) {
			await page.keyboard.type( 'a' );
		}

		// Create a new paragraph.
		await page.keyboard.press( 'Enter' );
		// Move to the start of the first line.
		await page.keyboard.press( 'ArrowUp' );
		// Insert a "." for testing.
		await page.keyboard.type( '.' );

		// Expect the "." to be added at the start of the paragraph
		await expect(
			editor.canvas.locator( 'role=document[name="Block: Paragraph"i]' )
		).toHaveText( /^a+\.a$/ );
	} );

	test( 'should vertically move the caret when pressing Alt', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );

		async function getHeight() {
			return await editor.canvas
				.locator( ':root' )
				.evaluate( () => document.activeElement.offsetHeight );
		}

		const height = await getHeight();

		// Keep typing until the height of the element increases. We need two
		// lines.
		while ( height === ( await getHeight() ) ) {
			await page.keyboard.type( 'a' );
		}

		// Create a new paragraph.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'ArrowLeft' );
		await pageUtils.pressKeys( 'alt+ArrowUp' );
		await page.keyboard.type( '.' );

		// Expect the "." to be added at the start of the paragraph
		await expect(
			editor.canvas.locator(
				'role=document[name="Block: Paragraph"i] >> nth = 0'
			)
		).toHaveText( /^.a+$/ );
	} );

	test( 'should select synced pattern', async ( { page, editor } ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'synced' );

		await editor.clickBlockOptionsMenuItem( 'Create pattern' );
		const createPatternDialog = editor.page.getByRole( 'dialog', {
			name: 'add new pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( 'test' );
		await page.keyboard.press( 'Enter' );

		await expect(
			editor.canvas.locator(
				'[data-type="core/block"] [data-type="core/paragraph"]'
			)
		).toBeVisible();

		await editor.insertBlock( { name: 'core/paragraph' } );

		await page.keyboard.press( 'ArrowUp' );

		await expect(
			editor.canvas.locator( '[data-type="core/block"]' )
		).toBeFocused();
	} );
} );

class WritingFlowUtils {
	constructor( { page, editor } ) {
		this.page = page;
		this.editor = editor;

		this.getActiveBlockName = this.getActiveBlockName.bind( this );
	}

	async getActiveBlockName() {
		return await this.page.evaluate(
			() =>
				window.wp.data.select( 'core/block-editor' ).getSelectedBlock()
					?.name
		);
	}

	async addDemoContent() {
		await this.page.keyboard.press( 'Enter' );
		await this.page.keyboard.type( 'First paragraph' );
		await this.page.keyboard.press( 'Enter' );
		await this.page.keyboard.type( '/columns' );
		await this.page.keyboard.press( 'Enter' );
		await this.editor.canvas
			.locator( 'role=button[name="Two columns; equal split"i]' )
			.click();
		await this.editor.canvas
			.locator( '.is-selected >> role=button[name="Add block"i]' )
			.click();
		await this.page.click(
			'role=listbox[name="Blocks"i] >> role=option[name="Paragraph"i]'
		);
		await this.page.keyboard.type( '1st col' ); // If this text is too long, it may wrap to a new line and cause test failure. That's why we're using "1st" instead of "First" here.

		await this.editor.canvas
			.locator( 'role=document[name="Block: Column (2 of 2)"i]' )
			.focus();
		await this.editor.canvas
			.locator( 'role=button[name="Add block"i]' )
			.click();
		await this.page.click(
			'role=listbox[name="Blocks"i] >> role=option[name="Paragraph"i]'
		);
		await this.page.keyboard.type( '2nd col' ); // If this text is too long, it may wrap to a new line and cause test failure. That's why we're using "2nd" instead of "Second" here.
		await this.editor.showBlockToolbar();
		await this.page.keyboard.press( 'Shift+Tab' ); // Move to toolbar to select parent
		await this.page.keyboard.press( 'Enter' ); // Selects the column block.
		await this.page.keyboard.press( 'Shift+Tab' ); // Move to toolbar to select parent
		await this.page.keyboard.press( 'Enter' ); // Selects the columns block.
		await this.page.keyboard.press( 'Enter' ); // Creates a paragraph after the columns block.
		await this.page.keyboard.type( 'Second paragraph' );
	}
}
