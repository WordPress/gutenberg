/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	writingFlowUtils: async ( { page }, use ) => {
		await use( new WritingFlowUtils( { page } ) );
	},
} );

test.describe( 'Writing Flow', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
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

		const activeElementLocator = page.locator( ':focus' );

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
		const activeElementBlockType = await page.evaluate( () =>
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

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'Should navigate between inner and root blocks in navigation mode', async ( {
		page,
		writingFlowUtils,
	} ) => {
		await writingFlowUtils.addDemoContent();

		// Switch to navigation mode.
		await page.keyboard.press( 'Escape' );
		// Arrow up to Columns block.
		await page.keyboard.press( 'ArrowUp' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/columns' );
		// Arrow right into Column block.
		await page.keyboard.press( 'ArrowRight' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/column' );
		// Arrow down to reach second Column block.
		await page.keyboard.press( 'ArrowDown' );
		// Arrow right again into Paragraph block.
		await page.keyboard.press( 'ArrowRight' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/paragraph' );
		// Arrow left back to Column block.
		await page.keyboard.press( 'ArrowLeft' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/column' );
		// Arrow left back to Columns block.
		await page.keyboard.press( 'ArrowLeft' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/columns' );
		// Arrow up to first paragraph.
		await page.keyboard.press( 'ArrowUp' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/paragraph' );
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
		await pageUtils.pressKeyTimes( 'ArrowLeft', 6 );

		// Bold second paragraph text.
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 6 );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );

		// Arrow left from selected bold should collapse to before the inline
		// boundary. Arrow once more to traverse into first paragraph.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( 'After' );

		// Arrow right from end of first should traverse to second, *BEFORE*
		// the bolded text. Another press should move within inline boundary.
		await pageUtils.pressKeyTimes( 'ArrowRight', 2 );
		await page.keyboard.type( 'Inside' );

		// Arrow left from end of beginning of inline boundary should move to
		// the outside of the inline boundary.
		await pageUtils.pressKeyTimes( 'ArrowLeft', 6 );
		await page.keyboard.press( 'ArrowLeft' ); // Separate for emphasis.
		await page.keyboard.type( 'Before' );

		// Likewise, test at the end of the inline boundary for same effect.
		await page.keyboard.press( 'ArrowRight' ); // Move inside
		await pageUtils.pressKeyTimes( 'ArrowRight', 12 );
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

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should navigate around nested inline boundaries', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( '1 2' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeyWithModifier( 'primary', 'i' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeyWithModifier( 'primary', 'i' );
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
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
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
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
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
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
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
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
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
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
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
<ul><!-- wp:list-item -->
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
			page.locator( 'role=document[name="Block: Shortcode"i]' )
		);

		// Should remain in title upon ArrowRight:
		await page.keyboard.press( 'ArrowRight' );
		await expect(
			page.locator( 'role=document[name="Block: Shortcode"i]' )
		).toHaveClass( /is-selected/ );

		// Should remain in title upon modifier + ArrowDown:
		await pageUtils.pressKeyWithModifier( 'primary', 'ArrowDown' );
		await expect(
			page.locator( 'role=document[name="Block: Shortcode"i]' )
		).toHaveClass( /is-selected/ );

		// Should navigate to the next block.
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			page.locator( 'role=document[name="Paragraph block"i]' )
		).toHaveClass( /is-selected/ );
	} );

	test( 'should not delete surrounding space when deleting a word with Backspace', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1 2 3' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', ' 3'.length );
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
		await pageUtils.pressKeyTimes( 'ArrowLeft', ' gamma'.length );

		await pageUtils.pressKeyWithModifier(
			process.platform === 'darwin' ? 'alt' : 'primary',
			'Backspace'
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
		await pageUtils.pressKeyTimes( 'ArrowLeft', ' gamma'.length );
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 'beta'.length );
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
		await pageUtils.pressKeyTimes( 'Enter', 10 );

		// Check that none of the paragraph blocks have <br> in them.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
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

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should navigate contenteditable with padding', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.evaluate( () => {
			document.activeElement.style.paddingTop = '100px';
		} );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '1' );
		await page.evaluate( () => {
			document.activeElement.style.paddingBottom = '100px';
		} );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( '2' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'should navigate contenteditable with normal line height', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.evaluate( () => {
			document.activeElement.style.lineHeight = 'normal';
		} );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '1' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
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
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '<<<' );
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', '<<\n<<<'.length );
		await page.keyboard.up( 'Shift' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
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
		await pageUtils.pressKeyTimes( 'ArrowUp', 2 );
		await pageUtils.pressKeyTimes( 'Delete', 2 );
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

	test( 'should preserve horizontal position when navigating vertically between blocks', async ( {
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
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
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
		await page.evaluate( () => {
			document.activeElement.style.paddingLeft = '100px';
		} );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.type( '1' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
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
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		// Extends selection into the first paragraph
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
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

		const paragraphBlock = page
			.locator( 'role=document[name="Paragraph block"i]' )
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
		await page.keyboard.press( 'Tab' );

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

		const paragraphBlock = page.locator(
			'role=document[name="Paragraph block"i]'
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
			page.locator( 'role=document[name="Block: Image"i]' )
		).toHaveClass( /is-selected/ );
	} );

	test( 'should only consider the content as one tab stop', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/table' );
		await page.keyboard.press( 'Enter' );
		// Tab to the "Create table" button.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		// Create the table.
		await page.keyboard.press( 'Space' );
		await expect(
			page.locator( 'role=document[name="Block: Table"i]' )
		).toBeVisible();
		// Navigate to the second cell.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '2' );
		// Confirm correct setup.
		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:table -->
<figure class="wp-block-table"><table><tbody><tr><td></td><td>2</td></tr><tr><td></td><td></td></tr></tbody></table></figure>
<!-- /wp:table -->` );
	} );

	test( 'should unselect all blocks when hitting double escape', async ( {
		page,
		writingFlowUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Random Paragraph' );

		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/paragraph' );

		// First escape enters navigaiton mode.
		await page.keyboard.press( 'Escape' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( 'core/paragraph' );

		// Second escape unselects the blocks.
		await page.keyboard.press( 'Escape' );
		await expect
			.poll( writingFlowUtils.getActiveBlockName )
			.toBe( undefined );
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
			page.locator( 'role=document[name="Paragraph block"i]' )
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
		await pageUtils.pressKeyTimes( 'ArrowLeft', 2 );
		await page.keyboard.down( 'Shift' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 2 );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.up( 'Shift' );
		await pageUtils.pressKeyWithModifier( 'primary', 'b' );

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>first</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>second</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'should move to the start of the first line on ArrowUp', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );

		async function getHeight() {
			return await page.evaluate(
				() => document.activeElement.offsetHeight
			);
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
			page.locator( 'role=document[name="Paragraph block"i]' )
		).toHaveText( /^\.a+$/ );
	} );

	test( 'should vertically move the caret from corner to corner', async ( {
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );

		async function getHeight() {
			return await page.evaluate(
				() => document.activeElement.offsetHeight
			);
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
			page.locator( 'role=document[name="Paragraph block"i]' )
		).toHaveText( /^a+\.a$/ );
	} );

	test( 'should vertically move the caret when pressing Alt', async ( {
		page,
		pageUtils,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );

		async function getHeight() {
			return await page.evaluate(
				() => document.activeElement.offsetHeight
			);
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
		await pageUtils.pressKeyWithModifier( 'alt', 'ArrowUp' );
		await page.keyboard.type( '.' );

		// Expect the "." to be added at the start of the paragraph
		await expect(
			page.locator( 'role=document[name="Paragraph block"i] >> nth = 0' )
		).toHaveText( /^.a+$/ );
	} );
} );

class WritingFlowUtils {
	constructor( { page } ) {
		this.page = page;

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
		await this.page.click(
			'role=button[name="Two columns; equal split"i]'
		);
		await this.page.click( 'role=button[name="Add block"i]' );
		await this.page.click(
			'role=listbox[name="Blocks"i] >> role=option[name="Paragraph"i]'
		);
		await this.page.keyboard.type( '1st col' ); // If this text is too long, it may wrap to a new line and cause test failure. That's why we're using "1st" instead of "First" here.

		await this.page.focus(
			'role=document[name="Block: Column (2 of 2)"i]'
		);
		await this.page.click( 'role=button[name="Add block"i]' );
		await this.page.click(
			'role=listbox[name="Blocks"i] >> role=option[name="Paragraph"i]'
		);
		await this.page.keyboard.type( '2nd col' ); // If this text is too long, it may wrap to a new line and cause test failure. That's why we're using "2nd" instead of "Second" here.

		await this.page.keyboard.press( 'Escape' ); // Enter navigation mode.
		await this.page.keyboard.press( 'ArrowLeft' ); // Move to the column block.
		await this.page.keyboard.press( 'ArrowLeft' ); // Move to the columns block.
		await this.page.keyboard.press( 'Enter' ); // Enter edit mode with the columns block selected.
		await this.page.keyboard.press( 'Enter' ); // Creates a paragraph after the columns block.
		await this.page.keyboard.type( 'Second paragraph' );
	}
}
