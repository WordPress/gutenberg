/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'List', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by using an asterisk at the start of a paragraph block', async ( {
		editor,
		page,
	} ) => {
		// Create a block with some text that will trigger a list creation.
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '* A list item' );

		// Create a second list item.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Another list item' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>A list item</li><li>Another list item</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by typing an asterisk in front of text of a paragraph block', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Create a list with the slash block shortcut.
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( 'test' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 4 );
		await page.keyboard.type( '* ' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>test</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by using a number at the start of a paragraph block', async ( {
		editor,
		page,
	} ) => {
		// Create a block with some text that will trigger a list creation.
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '1) A list item' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol><li>A list item</li></ol>
<!-- /wp:list -->`
		);
	} );

	test( 'can undo asterisk transform', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '1. ' );
		await pageUtils.pressKeyWithModifier( 'primary', 'z' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>1. </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with backspace', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '* ' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with backspace after selection changes', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '* ' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with backspace setting isTyping state', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '* ' );
		await editor.showBlockToolbar();
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with backspace after selection changes without requestIdleCallback', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.evaluate( () => delete window.requestIdleCallback );
		await page.keyboard.type( '* ' );
		await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with escape', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '* ' );
		await page.keyboard.press( 'Escape' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should not undo asterisk transform with backspace after typing', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '* a' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toBe( '' );
	} );

	test( 'should not undo asterisk transform with backspace after selection change', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '* ' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toBe( '' );
	} );

	test( 'can be created by typing "/list"', async ( { editor, page } ) => {
		// Create a list with the slash block shortcut.
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '/list' );
		await expect(
			page.locator( 'role=option[name="List"i][selected]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'I’m a list' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>I’m a list</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by converting a paragraph', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( 'test' );
		await editor.transformBlockTo( 'List' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>test</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by converting multiple paragraphs', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await page.click( '[data-type="core/paragraph"]:first-of-type' );
		await page.keyboard.up( 'Shift' );
		await editor.transformBlockTo( 'List' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one</li><li>two</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by converting a paragraph with line breaks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( 'one' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( 'two' );
		await editor.transformBlockTo( 'List' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one</li><li>two</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should not transform lines in block when transforming multiple blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( 'one' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );
		await page.keyboard.type( '...' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await page.click( '[data-type="core/paragraph"]:first-of-type' );
		await page.keyboard.up( 'Shift' );
		await editor.transformBlockTo( 'List' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one<br>...</li><li>two</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be converted to paragraphs', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await editor.transformBlockTo( 'Paragraph' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>one</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>two</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'can be converted when nested to paragraphs', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( 'two' );
		await editor.transformBlockTo( 'Paragraph' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>one</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>two</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'can be created by converting a quote', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/quote' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await editor.transformBlockTo( 'List' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one</li><li>two</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be converted to a quote', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await editor.transformBlockTo( 'Quote' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>one</p><p>two</p></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test( 'should create paragraph on split at end and merge back with content', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->`
		);

		await page.keyboard.type( 'two' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 'two'.length );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one</li><li>two</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should split into two with paragraph and merge lists', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one</li><li></li><li>two</li></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>two</li></ul>
<!-- /wp:list -->`
		);

		// Should remove paragraph without creating empty list item.
		await page.keyboard.press( 'Backspace' );

		// Should merge lists into one.
		await page.keyboard.press( 'ArrowDown' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 'two'.length );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one</li><li></li></ul>
<!-- /wp:list -->

<!-- wp:list -->
<ul><li>two</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should split into two ordered lists with paragraph', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '1. one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol><li>one</li></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><li>two</li></ol>
<!-- /wp:list -->`
		);
	} );

	test( 'should split indented list item', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'three' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one<ul><li>two</li><li>three</li></ul></li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should be immeadiately saved on indentation', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'm' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>one<ul><li></li></ul></li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should change the base list type', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		const button = await page.waitForSelector(
			'button[aria-label="Ordered"]'
		);
		await button.click();

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol><li></li></ol>
<!-- /wp:list -->`
		);
	} );

	test( 'should change the indented list type', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( '1' );

		await editor.clickBlockToolbarButton( 'Ordered' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a<ol><li>1</li></ol></li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should indent and outdent level 1', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( '1' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a<ul><li>1</li></ul></li></ul>
<!-- /wp:list -->`
		);

		await pageUtils.pressKeyWithModifier( 'primaryShift', 'm' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a</li><li>1</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should indent and outdent level 2', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( 'i' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a<ul><li>1<ul><li>i</li></ul></li></ul></li></ul>
<!-- /wp:list -->`
		);

		await pageUtils.pressKeyWithModifier( 'primaryShift', 'm' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a<ul><li>1</li><li>i</li></ul></li></ul>
<!-- /wp:list -->`
		);

		await pageUtils.pressKeyWithModifier( 'primaryShift', 'm' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a<ul><li>1</li></ul></li><li>i</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should outdent with children', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'primary', 'm' );
		await page.keyboard.type( 'c' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a<ul><li>b<ul><li>c</li></ul></li></ul></li></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'primaryShift', 'm' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a</li><li>b<ul><li>c</li></ul></li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should insert a line break on shift+enter', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a<br></li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should insert a line break on shift+enter in a non trailing list item', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'c' );
		await page.keyboard.press( 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Enter' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>a</li><li>b<br></li><li>c</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should create and remove indented list with keyboard only', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();

		await page.keyboard.type( '* 1' ); // Should be at level 0.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' a' ); // Should be at level 1.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' i' ); // Should be at level 2.

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1<ul><li>a<ul><li>i</li></ul></li></ul></li></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' ); // Should be at level 1.

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1<ul><li>a</li><li></li></ul></li></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should be at level 0.

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1<ul><li>a</li></ul></li><li></li></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should be at level 1.

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1<ul><li>a</li></ul></li></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' ); // Should be at level 0.

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1</li><li></li></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should be at level 0.

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1</li></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' ); // Should remove list.

		expect( await editor.getEditedPostContent() ).toBe( '' );

		// That's 9 key presses to create the list, and 9 key presses to remove
		// the list. ;)
	} );

	test( 'should place the caret in the right place with nested list', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' a' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		// The caret should land in the second item.
		await page.keyboard.type( '2' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1</li><li>2<ul><li>a</li></ul></li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should not indent list on space with modifier', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();

		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeyWithModifier( 'shift', 'Space' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1</li><li> </li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should only convert to list when shortcut ends with space', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();

		// Tests the shortcut with a non breaking space.
		await page.keyboard.type( '* ' );

		/* eslint-disable no-irregular-whitespace */
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
		/* eslint-enable no-irregular-whitespace */
	} );

	test( 'should preserve indentation after merging backward and forward', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();

		// Tests the shortcut with a non breaking space.
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Space' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );

		// Create a new paragraph.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		// Merge the pragraph back. No list items should be joined.
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1<ul><li>2</li><li>3</li></ul></li><li></li></ul>
<!-- /wp:list -->`
		);

		// Again create a new paragraph.
		await page.keyboard.press( 'Enter' );

		// Move to the end of the list.
		await page.keyboard.press( 'ArrowLeft' );

		// Merge forward. No list items should be joined.
		await page.keyboard.press( 'Delete' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>1<ul><li>2</li><li>3</li></ul></li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'first empty list item is graciously removed', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:list -->
<ul><li>2</li></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should not change the contents when you change the list type to Ordered', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await editor.clickBlockToolbarButton( 'Ordered' );

		const content = await page.locator( '.wp-block-list' ).innerHTML();
		expect( content ).toBe( `<li>1</li><li>2</li><li>3</li>` );
	} );

	test( 'should not change the contents when you change the list type to Unordered', async ( {
		editor,
		page,
	} ) => {
		await page.locator( 'role=button[name="Add default block"i]' ).click();
		await page.keyboard.type( '1. a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'c' );
		await editor.clickBlockToolbarButton( 'Unordered' );

		const content = await page.locator( '.wp-block-list' ).innerHTML();
		expect( content ).toBe( `<li>a</li><li>b</li><li>c</li>` );
	} );
} );
