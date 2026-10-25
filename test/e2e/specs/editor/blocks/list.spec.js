const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'List (@firefox)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be copied from multi selection', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+c' );
		await editor.insertBlock( { name: 'core/paragraph' } );
		await pageUtils.pressKeys( 'primary+v' );

		const copied = `<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`;

		expect( await editor.getEditedPostContent() ).toBe(
			copied + '\n\n' + copied
		);
	} );

	test( 'can be created by using an asterisk at the start of a paragraph block', async ( {
		editor,
		page,
	} ) => {
		// Create a block with some text that will trigger a list creation.
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* A list item' );

		// Create a second list item.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Another list item' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>A list item</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Another list item</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by typing an asterisk in front of text of a paragraph block', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Create a list with the slash block shortcut.
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'test' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 4 } );
		await page.keyboard.type( '* ' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>test</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by using a number at the start of a paragraph block', async ( {
		editor,
		page,
	} ) => {
		// Create a block with some text that will trigger a list creation.
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1) A list item' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list"><!-- wp:list-item -->
<li>A list item</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list -->`
		);
	} );

	test( 'can undo asterisk transform', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1. ' );
		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>1. </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with backspace (-firefox)', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with backspace after selection changes (-firefox)', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ' );
		await expect(
			editor.canvas.locator( '[data-type="core/list"]' )
		).toBeVisible();
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with backspace setting isTyping state (-firefox)', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ' );
		await editor.showBlockToolbar();
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with backspace after selection changes without requestIdleCallback (-firefox)', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.evaluate( () => delete window.requestIdleCallback );
		await page.keyboard.type( '* ' );
		await expect(
			editor.canvas.locator( '[data-type="core/list"]' )
		).toBeVisible();
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should undo asterisk transform with escape (-firefox)', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ' );
		await page.keyboard.press( 'Escape' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
		// The undo claims the Escape; it must not also step out of the
		// canvas onto its stop.
		await expect(
			page.getByRole( 'button', { name: 'Editor canvas' } )
		).not.toBeFocused();
	} );

	test( 'should not undo asterisk transform with backspace after typing', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* a' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
	} );

	test( 'should not undo asterisk transform with backspace after selection change', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/paragraph' } );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '* ' );
		await expect(
			editor.canvas.locator( '[data-type="core/list"]' )
		).toBeVisible();
		// Wait until the automatic change is marked as "final", which is done
		// with an idle callback, see __unstableMarkAutomaticChange.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
	} );

	test( 'can be created by typing "/list"', async ( { editor, page } ) => {
		// Create a list with the slash block shortcut.
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/list' );
		await expect(
			page.locator( 'role=option[name="List"i][selected]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'I’m a list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>I’m a list</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by converting a paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'test' );
		await editor.transformBlockTo( 'core/list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>test</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by converting multiple paragraphs', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await editor.canvas
			.locator( '[data-type="core/paragraph"] >> nth=0' )
			.click();
		await page.keyboard.up( 'Shift' );
		await editor.transformBlockTo( 'core/list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by converting a paragraph with line breaks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'one' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await page.keyboard.type( 'two' );
		await editor.transformBlockTo( 'core/list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should not transform lines in block when transforming multiple blocks', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( 'one' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await page.keyboard.type( '...' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await editor.canvas
			.locator( '[data-type="core/paragraph"] >> nth=0' )
			.click();
		await page.keyboard.up( 'Shift' );
		await editor.transformBlockTo( 'core/list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one<br>...</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be converted to paragraphs', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await editor.clickBlockToolbarButton( 'Select parent block: List' );
		await editor.transformBlockTo( 'core/paragraph' );

		await expect.poll( editor.getEditedPostContent ).toBe(
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
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( 'two' );
		// Select all escalates: text → block → siblings → parent, repeat
		// until the top-level list block is selected.
		await pageUtils.pressKeys( 'primary+a', { times: 5 } );
		await editor.transformBlockTo( 'core/paragraph' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>one</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>two</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'can be converted to a quote', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await editor.clickBlockToolbarButton( 'Select parent block: List' );
		await editor.transformBlockTo( 'core/quote' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></blockquote>
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

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->`
		);

		await page.keyboard.type( 'two' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 'two'.length } );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ul>
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

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		// Should remove paragraph without creating empty list item.
		await page.keyboard.press( 'Backspace' );

		// Should merge lists into one.
		await page.keyboard.press( 'ArrowDown' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 'two'.length } );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should keep nested list items when merging with paragraph', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const startingContent = [
			{
				name: 'core/paragraph',
				attributes: { content: 'p' },
			},
			{
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
										attributes: { content: 'i' },
									},
								],
							},
						],
					},
				],
			},
		];
		for ( const block of startingContent ) {
			await editor.insertBlock( block );
		}

		// Move the caret in front of "1" in the first list item.
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'p' },
			},
			{
				name: 'core/paragraph',
				attributes: { content: '1' },
			},
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'i' },
					},
				],
			},
		] );

		await pageUtils.pressKeys( 'primary+z' );

		await expect.poll( editor.getBlocks ).toMatchObject( startingContent );
	} );

	test( 'should split into two ordered lists with paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1. one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list"><!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ol>
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

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>three</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should be immediately saved on indentation', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should change the base list type', async ( { editor } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await editor.clickBlockToolbarButton( 'Select parent block: List' );
		await editor.clickBlockToolbarButton( 'Ordered' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list"><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ol>
<!-- /wp:list -->`
		);
	} );

	test( 'should change the indented list type', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( '1' );
		await editor.clickBlockToolbarButton( 'Select parent block: List' );
		await editor.clickBlockToolbarButton( 'Ordered' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list"><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should create paragraph on Enter in quote block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/quote' } );
		await page.keyboard.type( '/list' );
		await page.getByRole( 'option', { name: 'List', exact: true } ).click();
		await page.keyboard.type( 'aaa' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>aaa</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test( 'should indent and outdent level 1', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( '1' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await editor.clickBlockToolbarButton( 'Outdent' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should indent and outdent a list item when its content is fully selected', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );

		// Select the whole item and Tab to indent it.
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.press( 'Tab' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		// The item stays fully selected, so typing replaces its content.
		await page.keyboard.type( 'c' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		// Select the whole item again and Shift+Tab to outdent it.
		await pageUtils.pressKeys( 'primary+a' );
		await page.keyboard.press( 'Shift+Tab' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should indent with Space and outdent with Shift+Space at the start', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );

		// Move the caret to the start of the item and Space to indent it.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Space' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		// Shift+Space at the start outdents it back to the top level.
		await page.keyboard.press( 'Shift+Space' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should keep the list type when indenting an ordered list item', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/list',
			attributes: { ordered: true },
		} );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await editor.clickBlockToolbarButton( 'Indent' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list"><!-- wp:list-item -->
<li>one<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list"><!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ol>
<!-- /wp:list -->`
		);
	} );

	test( 'should indent and outdent level 2', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( 'i' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>i</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await editor.clickBlockToolbarButton( 'Outdent' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>i</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		// To do: investigate why the toolbar is not showing up right after
		// outdenting.
		await page.keyboard.press( 'ArrowLeft' );
		await editor.clickBlockToolbarButton( 'Outdent' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>i</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should indent into the last nested list when an item has several', async ( {
		editor,
	} ) => {
		// A list item can hold more than one nested list. Indenting a sibling
		// into it should append to the last nested list, not the first.
		await editor.setContent(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>A<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>x</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>y</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>B</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await editor.canvas.getByText( 'B', { exact: true } ).click();
		await editor.clickBlockToolbarButton( 'Indent' );

		// "B" joins "y" in the last nested list, after it.
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>A

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>x</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>y</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>B</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should outdent with children', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.type( 'c' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>b<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'ArrowUp' );
		await editor.clickBlockToolbarButton( 'Outdent' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>b<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should indent and outdent multi-selected items with Tab', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'three' );

		// Select across the last two items.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 3 } );
		await pageUtils.pressKeys( 'shift+ArrowUp' );

		// Tab indents both items under the first, as a whole block selection.
		await page.keyboard.press( 'Tab' );
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveCount( 2 );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>three</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		// Shift+Tab outdents them back to the top level.
		await page.keyboard.press( 'Shift+Tab' );
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveCount( 2 );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>two</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>three</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should keep a full selection when outdenting nested items with Shift+Tab', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// "a" with "b" and "c" nested beneath it.
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await editor.clickBlockToolbarButton( 'Indent' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'c' );

		// Select across "b" and "c".
		await pageUtils.pressKeys( 'ArrowLeft' );
		await pageUtils.pressKeys( 'shift+ArrowUp' );

		await page.keyboard.press( 'Shift+Tab' );

		// The two items come back to the top level and stay selected as whole
		// blocks, rather than leaving a hidden partial selection with nothing
		// highlighted.
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
		await expect(
			editor.canvas.locator(
				'.is-multi-selected:not(.is-partially-selected)'
			)
		).toHaveCount( 2 );
	} );

	test( 'should insert a line break on shift+enter', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'a' );
		await pageUtils.pressKeys( 'shift+Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<br></li>
<!-- /wp:list-item --></ul>
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
		await pageUtils.pressKeys( 'shift+Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>b<br></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should create and remove indented list with keyboard only', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();

		await page.keyboard.type( '* 1' ); // Should be at level 0.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' a' ); // Should be at level 1.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' i' ); // Should be at level 2.

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>i</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should delete "i".

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should merge into "a".

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should delete "a".

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should merge into "1".

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should delete "1".

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should remove list.

		await expect.poll( editor.getEditedPostContent ).toBe( '' );

		// That's 9 key presses to create the list, and 6 key presses to remove
		// the list. ;)
	} );

	test( 'should outdent an empty middle item without adding an item', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();

		await page.keyboard.type( '* a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'c' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'ArrowUp' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Shift+Tab' );
		// Type to also verify the caret stays in the outdented item.
		await page.keyboard.type( 'x' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>x<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should try to preserve the indentation level of nested items as their parent gets merged', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();

		await page.keyboard.type( '* a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' c' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'd' );
		await page.keyboard.press( 'Enter' );
		// Enter on an empty item outdents it, one level per press.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'e' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'b' },
										innerBlocks: [
											{
												name: 'core/list',
												innerBlocks: [
													{
														name: 'core/list-item',
														attributes: {
															content: 'c',
														},
													},
													{
														name: 'core/list-item',
														attributes: {
															content: 'd',
														},
													},
												],
											},
										],
									},
								],
							},
						],
					},
					{
						name: 'core/list-item',
						attributes: { content: 'e' },
					},
				],
			},
		] );

		// Place caret to the right of list-item "c"
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowRight' );

		// Backspace should empty the text of that list-item, and nothing else
		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'b' },
										innerBlocks: [
											{
												name: 'core/list',
												innerBlocks: [
													{
														name: 'core/list-item',
														attributes: {
															content: '',
														},
													},
													{
														name: 'core/list-item',
														attributes: {
															content: 'd',
														},
													},
												],
											},
										],
									},
								],
							},
						],
					},
					{
						name: 'core/list-item',
						attributes: { content: 'e' },
					},
				],
			},
		] );

		// Now that the item is empty, backspace merges it into "b", and
		// "d" keeps its original indentation level as a child of "b".
		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'b' },
										innerBlocks: [
											{
												name: 'core/list',
												innerBlocks: [
													{
														name: 'core/list-item',
														attributes: {
															content: 'd',
														},
													},
												],
											},
										],
									},
								],
							},
						],
					},
					{
						name: 'core/list-item',
						attributes: { content: 'e' },
					},
				],
			},
		] );
	} );

	test( 'should place the caret in the right place with nested list', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' a' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		// The caret should land in the second item.
		await page.keyboard.type( '2' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>2<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should not indent list on space with modifier', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();

		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'shift+Space' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li> </li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should only convert to list when shortcut ends with space', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();

		// Tests the shortcut with a non breaking space.
		await page.keyboard.type( '*\u00a0' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>*\u00a0</p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should preserve indentation after merging backward and forward (-firefox)', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();

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

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>2</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>3</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		// Again create a new paragraph.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		// Move to the end of the list.
		await page.keyboard.press( 'ArrowLeft' );

		// Merge forward. No list items should be joined.
		await page.keyboard.press( 'Delete' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>2</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>3</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'first empty list item is graciously removed', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>2</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'remove empty list graciously through UI', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* 1' );

		await editor.clickBlockToolbarButton( 'Options' );
		await page.getByRole( 'menuitem', { name: 'Delete' } ).click();

		expect( await editor.getEditedPostContent() ).toBe( '' );
	} );

	test( 'should not change the contents when you change the list type to Ordered', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await editor.clickBlockToolbarButton( 'Select parent block: List' );
		await editor.clickBlockToolbarButton( 'Ordered' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol class="wp-block-list"><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>2</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>3</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list -->`
		);
	} );

	test( 'should not change the contents when you change the list type to Unordered', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '1. a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'c' );
		await editor.clickBlockToolbarButton( 'Select parent block: List' );
		await editor.clickBlockToolbarButton( 'Unordered' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by pasting an empty list (-firefox)', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Open code editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		// Add empty list block
		await page.getByPlaceholder( 'Start writing with text or HTML' )
			.fill( `<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );

		// Go back to normal editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		// Verify no WSOD and content is proper.
		expect( await editor.getEditedPostContent() ).toBe( `<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );
	} );

	test( 'should merge two list with same attributes', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '* c' );

		await expect.poll( editor.getEditedPostContent ).toBe( `<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );

		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe( `<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );
	} );

	test( 'can be exited to selected paragraph', async ( { editor, page } ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );

		expect( await editor.getEditedPostContent() ).toBe( `<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->` );
	} );

	test( 'selects all transformed output', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/list',
			innerBlocks: [
				{ name: 'core/list-item', attributes: { content: '1' } },
				{ name: 'core/list-item', attributes: { content: '2' } },
			],
		} );

		await editor.selectBlocks(
			editor.canvas.locator( 'role=document[name="Block: List"i]' )
		);

		await page.getByRole( 'button', { name: 'List', exact: true } ).click();
		await page
			.getByRole( 'menuitem', { name: 'Paragraph', exact: true } )
			.click();

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>2</p>
<!-- /wp:paragraph -->` );

		await page
			.getByRole( 'button', { name: 'Multiple blocks selected' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'List' } ).click();

		expect( await editor.getEditedPostContent() ).toBe( `<!-- wp:list -->
<ul class="wp-block-list"><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>2</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );
	} );

	test.describe( 'should merge two list items with nested lists', () => {
		const start = {
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
									attributes: { content: 'a' },
								},
							],
						},
					],
				},
				{
					name: 'core/list-item',
					attributes: { content: '2' },
					innerBlocks: [
						{
							name: 'core/list',
							innerBlocks: [
								{
									name: 'core/list-item',
									attributes: { content: 'b' },
								},
							],
						},
					],
				},
			],
		};
		const end = [
			{
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
										attributes: { content: 'a‸2' },
									},
									{
										name: 'core/list-item',
										attributes: { content: 'b' },
									},
								],
							},
						],
					},
				],
			},
		];

		test( 'Backspace', async ( { editor, page } ) => {
			await editor.insertBlock( start );

			// Navigate to the start of item "2".
			await page.keyboard.press( 'ArrowDown' );
			await page.keyboard.press( 'ArrowDown' );
			await page.keyboard.press( 'ArrowDown' );

			await page.keyboard.press( 'Backspace' );

			// Test caret position.
			await page.keyboard.type( '‸' );

			await expect.poll( editor.getBlocks ).toMatchObject( end );
		} );

		test( 'Delete (forward)', async ( { editor, page } ) => {
			await editor.insertBlock( start );

			await page.keyboard.press( 'ArrowDown' );
			await page.keyboard.press( 'ArrowDown' );
			await page.keyboard.press( 'ArrowRight' );

			await page.keyboard.press( 'Delete' );

			// Test caret position.
			await page.keyboard.type( '‸' );

			await expect.poll( editor.getBlocks ).toMatchObject( end );
		} );
	} );

	test.describe( 'should preserve a nested list when deleting a text selection across sibling list items', () => {
		const start = {
			name: 'core/list',
			innerBlocks: [
				{
					name: 'core/list-item',
					attributes: { content: 'ab' },
				},
				{
					name: 'core/list-item',
					attributes: { content: 'cd' },
					innerBlocks: [
						{
							name: 'core/list',
							innerBlocks: [
								{
									name: 'core/list-item',
									attributes: { content: 'test' },
								},
							],
						},
					],
				},
			],
		};
		const end = [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a‸d' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'test' },
									},
								],
							},
						],
					},
				],
			},
		];

		for ( const key of [ 'Backspace', 'Delete' ] ) {
			test( key, async ( { editor, page, pageUtils } ) => {
				await editor.canvas
					.locator( 'role=document[name="Add default block"i]' )
					.click();
				await page.keyboard.type( '* ab' );
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( 'cd' );
				await page.keyboard.press( 'Enter' );
				// Leading space at the start of an empty item triggers indent.
				await page.keyboard.type( ' test' );

				// Verify setup: sibling items "ab" and "cd", the latter with a
				// nested "test" item; caret at the end of "test".
				await page.keyboard.type( '‸' );
				await expect.poll( editor.getBlocks ).toMatchObject( [
					{
						...start,
						innerBlocks: [
							start.innerBlocks[ 0 ],
							{
								...start.innerBlocks[ 1 ],
								innerBlocks: [
									{
										name: 'core/list',
										innerBlocks: [
											{
												name: 'core/list-item',
												attributes: {
													content: 'test‸',
												},
											},
										],
									},
								],
							},
						],
					},
				] );
				await page.keyboard.press( 'Backspace' );

				// Move up to the end of "cd" (the longer, more indented "test"
				// line clamps the caret to the end of the shorter line above),
				// then back one character to offset 1.
				await page.keyboard.press( 'ArrowUp' );
				await page.keyboard.press( 'ArrowLeft' );

				// Extend the selection backward to offset 1 of "ab" (away from
				// the nested list), then yield to an idle callback so the
				// multi-block selection can catch up before deleting.
				await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 3 } );
				await page.evaluate(
					() => new Promise( window.requestIdleCallback )
				);

				await page.keyboard.press( key );

				await page.keyboard.type( '‸' );
				await expect.poll( editor.getBlocks ).toMatchObject( end );
			} );
		}
	} );

	test.describe( 'should delete a nested list inside a text selection across sibling list items', () => {
		// The nested "x" was inside the deleted range, so the merged item
		// must have no inner blocks left.
		const end = [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a‸d' },
						innerBlocks: [],
					},
				],
			},
		];

		for ( const key of [ 'Backspace', 'Delete' ] ) {
			test( key, async ( { editor, page, pageUtils } ) => {
				await editor.canvas
					.locator( 'role=document[name="Add default block"i]' )
					.click();
				await page.keyboard.type( '* ab' );
				await page.keyboard.press( 'Enter' );
				// Leading space at the start of an empty item triggers indent.
				await page.keyboard.type( ' x' );
				// Enter on an empty nested item outdents back to the top level.
				await page.keyboard.press( 'Enter' );
				await page.keyboard.press( 'Enter' );
				await page.keyboard.type( 'cd' );

				// Verify setup: "ab" with a nested "x" item, then sibling
				// "cd" at the top level; caret at the end of "cd".
				await page.keyboard.type( '‸' );
				await expect.poll( editor.getBlocks ).toMatchObject( [
					{
						name: 'core/list',
						innerBlocks: [
							{
								name: 'core/list-item',
								attributes: { content: 'ab' },
								innerBlocks: [
									{
										name: 'core/list',
										innerBlocks: [
											{
												name: 'core/list-item',
												attributes: { content: 'x' },
											},
										],
									},
								],
							},
							{
								name: 'core/list-item',
								attributes: { content: 'cd‸' },
							},
						],
					},
				] );
				await page.keyboard.press( 'Backspace' );

				// Navigate to the middle of "ab" (offset 1). ArrowUp from
				// the end of a longer/more-indented line below clamps the
				// caret to the end of the shorter line above, so two
				// ArrowUps land at the end of "ab"; ArrowLeft then puts
				// the caret between "a" and "b".
				await page.keyboard.press( 'ArrowUp' );
				await page.keyboard.press( 'ArrowUp' );
				await page.keyboard.press( 'ArrowLeft' );

				// Extend the selection forward two lines into "cd", then
				// yield to an idle callback so the multi-block selection
				// can catch up before deleting.
				await pageUtils.pressKeys( 'shift+ArrowDown', { times: 2 } );
				await page.evaluate(
					() => new Promise( window.requestIdleCallback )
				);

				await page.keyboard.press( key );

				await page.keyboard.type( '‸' );
				await expect.poll( editor.getBlocks ).toMatchObject( end );
			} );
		}
	} );

	test( 'should select the outer item fully when a text selection crosses the nesting boundary backward', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ab' );
		await page.keyboard.press( 'Enter' );
		// Leading space at the start of an empty item triggers indent.
		await page.keyboard.type( ' cd' );
		// Enter on an empty nested item outdents back to the top level.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'zz' );

		// Move the caret to the middle of "cd", and verify the setup:
		// "ab" with a nested "cd" item, then a top-level sibling "zz".
		await pageUtils.pressKeys( 'ArrowLeft', { times: 4 } );
		await page.keyboard.type( '‸' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'ab' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'c‸d' },
									},
								],
							},
						],
					},
					{
						name: 'core/list-item',
						attributes: { content: 'zz' },
					},
				],
			},
		] );
		await page.keyboard.press( 'Backspace' );

		// Extend the selection backward into "ab": over "c", over the
		// nesting boundary, then over "b". Yield so the selection
		// observer can process it.
		await pageUtils.pressKeys( 'shift+ArrowLeft', { times: 3 } );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		// The outer "ab" item is presented as fully selected, like a
		// block multi-selection.
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveCount( 1 );
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveText( 'abcd' );

		// The native selection is untouched (only hidden by the block
		// overlay), so the gesture could still continue.
		expect(
			await page
				.frame( { name: 'editor-canvas' } )
				.evaluate( () =>
					document.getSelection().toString().replace( /\s/g, '' )
				)
		).toBe( 'bc' );

		// A partial selection across a nesting boundary is not
		// mergeable; the press removes the fully selected item as a
		// whole, together with its nested list; the unrelated sibling
		// remains.
		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'zz' },
						innerBlocks: [],
					},
				],
			},
		] );
	} );

	test( 'should select the outer item fully when a text selection crosses the nesting boundary forward', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ab' );
		await page.keyboard.press( 'Enter' );
		// Leading space at the start of an empty item triggers indent.
		await page.keyboard.type( ' cd' );
		// Enter on an empty nested item outdents back to the top level.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'zz' );

		// Move the caret to the middle of "ab" and verify.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 7 } );
		await page.keyboard.type( '‸' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a‸b' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'cd' },
									},
								],
							},
						],
					},
					{
						name: 'core/list-item',
						attributes: { content: 'zz' },
					},
				],
			},
		] );
		await page.keyboard.press( 'Backspace' );

		// Extend the selection forward past the nesting boundary into
		// "cd", then yield so the selection observer can process it.
		await pageUtils.pressKeys( 'shift+ArrowRight', { times: 2 } );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		// The outer "ab" item is presented as fully selected, like a
		// block multi-selection.
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveCount( 1 );
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveText( 'abcd' );

		// A partial selection across a nesting boundary is not
		// mergeable; the press removes the fully selected item as a
		// whole, together with its nested list; the unrelated sibling
		// remains.
		await page.keyboard.press( 'Delete' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'zz' },
						innerBlocks: [],
					},
				],
			},
		] );
	} );

	test( 'should select the outer item fully when dragging a selection across the nesting boundary', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ab' );
		await page.keyboard.press( 'Enter' );
		// Leading space at the start of an empty item triggers indent.
		await page.keyboard.type( ' cd' );
		// Enter on an empty nested item outdents back to the top level.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'zz' );

		// Drag from the middle of "ab" to the middle of "cd".
		const outer = await editor.canvas
			.getByText( 'ab', { exact: true } )
			.boundingBox();
		const nested = await editor.canvas
			.getByText( 'cd', { exact: true } )
			.boundingBox();
		await page.mouse.move(
			outer.x + outer.width / 2,
			outer.y + outer.height / 2
		);
		await page.mouse.down();
		await page.mouse.move(
			nested.x + nested.width / 2,
			nested.y + nested.height / 2,
			{ steps: 10 }
		);

		await page.mouse.up();
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		// The outer "ab" item is presented as fully selected, like a
		// block multi-selection.
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveCount( 1 );
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveText( 'abcd' );

		// The press removes the fully selected item as a whole, together
		// with its nested list; the unrelated sibling remains.
		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'zz' },
						innerBlocks: [],
					},
				],
			},
		] );
	} );

	test( 'should select the outer item fully when extending a selection down into its nested item', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* ab' );
		await page.keyboard.press( 'Enter' );
		// Leading space at the start of an empty item triggers indent.
		await page.keyboard.type( ' cd' );
		// Enter on an empty nested item outdents back to the top level.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'zz' );

		// Move the caret to the middle of "ab" and verify the setup:
		// "ab" with a nested "cd" item, then a top-level sibling "zz".
		await pageUtils.pressKeys( 'ArrowLeft', { times: 7 } );
		await page.keyboard.type( '‸' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a‸b' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'cd' },
									},
								],
							},
						],
					},
					{
						name: 'core/list-item',
						attributes: { content: 'zz' },
					},
				],
			},
		] );
		await page.keyboard.press( 'Backspace' );

		// Extend the selection down into the nested "cd" line, then
		// yield so the selection observer can process it.
		await page.keyboard.press( 'Shift+ArrowDown' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		// The outer "ab" item is presented as fully selected, like a
		// block multi-selection.
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveCount( 1 );
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveText( 'abcd' );

		// The native selection is untouched (only hidden by the block
		// overlay), so the gesture could still continue. It reaches from
		// the middle of "ab" into the nested "cd" item. The selected
		// text is not asserted because the line navigation lands at the
		// start of the indented nested line, right before "cd".
		expect(
			await page.frame( { name: 'editor-canvas' } ).evaluate( () => {
				const selection = document.getSelection();
				return {
					anchor: selection.anchorNode.textContent,
					anchorOffset: selection.anchorOffset,
					focus: selection.focusNode.textContent,
					focusOffset: selection.focusOffset,
				};
			} )
		).toMatchObject( {
			anchor: 'ab',
			anchorOffset: 1,
			focus: 'cd',
			focusOffset: 0,
		} );

		// The press removes the fully selected item as a whole, together
		// with its nested list; the unrelated sibling remains.
		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'zz' },
						innerBlocks: [],
					},
				],
			},
		] );
	} );

	test( 'should multi-select the top level items when extending a selection down across an item with a nested item', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'Enter' );
		// Leading space at the start of an empty item triggers indent.
		await page.keyboard.type( ' nested' );

		// Move the caret to the end of "one" and verify the setup: "one"
		// and "two" at the top level, "nested" indented under "two".
		await pageUtils.pressKeys( 'ArrowLeft', { times: 11 } );
		await page.keyboard.type( '‸' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'one‸' },
					},
					{
						name: 'core/list-item',
						attributes: { content: 'two' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'nested' },
									},
								],
							},
						],
					},
				],
			},
		] );
		await page.keyboard.press( 'Backspace' );

		// Extend the selection down across "two" into "nested".
		await page.keyboard.press( 'Shift+ArrowDown' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.press( 'Shift+ArrowDown' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		// The endpoints are promoted to the top level items, which are
		// multi-selected as blocks.
		await expect(
			editor.canvas.locator( '.is-multi-selected' )
		).toHaveCount( 2 );

		// Both items, including the nested one, are removed, and with
		// them the emptied list itself.
		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getBlocks ).toEqual( [] );
	} );

	test( 'should multi-select the top level items when extending a selection from a nested item to the previous top level item', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '* one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'Enter' );
		// Leading space at the start of an empty item triggers indent.
		await page.keyboard.type( ' nested' );

		// Verify setup: "one" and "two" at the top level, "nested"
		// indented under "two"; caret at the end of "nested".
		await page.keyboard.type( '‸' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'one' },
					},
					{
						name: 'core/list-item',
						attributes: { content: 'two' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'nested‸' },
									},
								],
							},
						],
					},
				],
			},
		] );
		await page.keyboard.press( 'Backspace' );

		// Extend the selection up across "two" to "one".
		await page.keyboard.press( 'Shift+ArrowUp' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.press( 'Shift+ArrowUp' );
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );

		// The endpoints are promoted to the top level items, which are
		// multi-selected as blocks. The announcement discloses the list
		// nested in the second item.
		await expect( page.locator( '[aria-live="assertive"]' ) ).toHaveText(
			'2 blocks selected, 4 including nested blocks.'
		);

		// Both items, including the nested one, are removed, and with
		// them the emptied list itself.
		await page.keyboard.press( 'Backspace' );
		await expect.poll( editor.getBlocks ).toEqual( [] );
	} );

	test( 'should merge a following paragraph into the outermost list with Delete from a nested item (#77245)', async ( {
		editor,
		page,
	} ) => {
		const startingContent = [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'outer' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'inner' },
									},
								],
							},
						],
					},
				],
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'text' },
			},
		];
		for ( const block of startingContent ) {
			await editor.insertBlock( block );
		}

		// Place the cursor at the end of "inner" by stepping back from
		// the start of the paragraph.
		await page.keyboard.press( 'Home' );
		await page.keyboard.press( 'ArrowLeft' );

		await page.keyboard.press( 'Delete' );

		// The caret stays at the end of "inner" — Delete shouldn't
		// move the cursor away from the block the user pressed it in.
		await page.keyboard.type( '‸' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'outer' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'inner‸' },
									},
								],
							},
						],
					},
					{
						name: 'core/list-item',
						attributes: { content: 'text' },
					},
				],
			},
		] );
	} );

	test( 'should merge a following sibling list into the outermost list with Delete from a nested item (#77245)', async ( {
		editor,
		page,
	} ) => {
		const startingContent = [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'b' },
									},
								],
							},
						],
					},
				],
			},
			{
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
			},
		];
		for ( const block of startingContent ) {
			await editor.insertBlock( block );
		}

		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowRight' );

		// Verify the setup: caret lands at end of the first list's
		// inner "b".
		await page.keyboard.type( '‸' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'b‸' },
									},
								],
							},
						],
					},
				],
			},
			{
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
			},
		] );
		await page.keyboard.press( 'Backspace' );

		// Action under test.
		await page.keyboard.press( 'Delete' );

		// Caret stays at end of "b"; the second list's items are
		// absorbed as outer-level siblings of "a".
		await page.keyboard.type( '‸' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'a' },
						innerBlocks: [
							{
								name: 'core/list',
								innerBlocks: [
									{
										name: 'core/list-item',
										attributes: { content: 'b‸' },
									},
								],
							},
						],
					},
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
			},
		] );
	} );

	test( 'should remove an anchored list when deleting its last item', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/list',
			attributes: { anchor: 'list' },
			innerBlocks: [
				{ name: 'core/list-item', attributes: { anchor: 'item' } },
			],
		} );
		// Inserting selects the list container; ArrowDown moves the caret
		// into the sole empty item.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( 'x' );

		// Typing lands in the sole item, verifying both the setup and the
		// caret position.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				attributes: { anchor: 'list' },
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: 'x', anchor: 'item' },
					},
				],
			},
		] );

		// Delete the text, then the emptied item: the anchors are not
		// content, so the item and the list are removed together instead
		// of the item being lifted out as a paragraph first.
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getBlocks ).toEqual( [] );
	} );

	test( 'should leave nested list intact when deleting the parent item', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/list',
			innerBlocks: [
				{
					name: 'core/list-item',
					attributes: { content: '1' },
				},
				{
					name: 'core/list-item',
					attributes: { content: '' },
					innerBlocks: [
						{
							name: 'core/list',
							innerBlocks: [
								{
									name: 'core/list-item',
									attributes: { content: 'a' },
								},
							],
						},
					],
				},
				{ name: 'core/list-item', attributes: { content: '3' } },
			],
		} );

		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
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
										attributes: { content: 'a' },
									},
								],
							},
						],
					},
					{ name: 'core/list-item', attributes: { content: '3' } },
				],
			},
		] );
	} );

	test( 'should outdent list items when deleting an empty parent at the top', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/list',
			innerBlocks: [
				{
					name: 'core/list-item',
					attributes: { content: '' },
					innerBlocks: [
						{
							name: 'core/list',
							innerBlocks: [
								{
									name: 'core/list-item',
									attributes: { content: 'a' },
								},
								{
									name: 'core/list-item',
									attributes: { content: 'b' },
								},
							],
						},
					],
				},
			],
		} );

		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/list',
				innerBlocks: [
					{ name: 'core/list-item', attributes: { content: 'a' } },
					{ name: 'core/list-item', attributes: { content: 'b' } },
				],
			},
		] );
	} );

	test( 'should leave the rest of the list intact when merging into an empty list item', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
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
									attributes: { content: 'a' },
								},
								{
									name: 'core/list-item',
									attributes: { content: 'b' },
								},
							],
						},
					],
				},
			],
		} );

		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Backspace' );

		expect( await editor.getBlocks() ).toMatchObject( [
			{
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
										attributes: { content: 'a' },
									},
									{
										name: 'core/list-item',
										attributes: { content: 'b' },
									},
								],
							},
						],
					},
				],
			},
		] );
	} );

	test( 'should select the list wrapper with select all in empty list item', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );

		// Verify the list item is selected after insertion.
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlock()?.name
				)
			)
			.toBe( 'core/list-item' );

		// The list item is empty. Press cmd+a to select all, then again to select the list block.
		await pageUtils.pressKeys( 'primary+a' );
		await pageUtils.pressKeys( 'primary+a' );

		// Verify the list block is selected using the block-editor store.
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlock()?.name
				)
			)
			.toBe( 'core/list' );
	} );
} );
