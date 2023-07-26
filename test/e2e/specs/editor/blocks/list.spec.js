/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'List (@firefox)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by using an asterisk at the start of a paragraph block', async ( {
		editor,
		page,
	} ) => {
		// Create a block with some text that will trigger a list creation.
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '* A list item' );

		// Create a second list item.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Another list item' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'test' );
		await pageUtils.pressKeys( 'ArrowLeft', { times: 4 } );
		await page.keyboard.type( '* ' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '1) A list item' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '* ' );
		await page.keyboard.press( 'Escape' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:paragraph -->
<p>* </p>
<!-- /wp:paragraph -->`
		);
	} );

	test( 'should not undo asterisk transform with backspace after typing', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '* a' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe( '' );
	} );

	test( 'should not undo asterisk transform with backspace after selection change', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '/list' );
		await expect(
			page.locator( 'role=option[name="List"i][selected]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'I’m a list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>I’m a list</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by converting a paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'test' );
		await editor.transformBlockTo( 'core/list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>test</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'can be created by converting multiple paragraphs', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await editor.canvas.click( '[data-type="core/paragraph"] >> nth=0' );
		await page.keyboard.up( 'Shift' );
		await editor.transformBlockTo( 'core/list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'one' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await page.keyboard.type( 'two' );
		await editor.transformBlockTo( 'core/list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'one' );
		await pageUtils.pressKeys( 'shift+Enter' );
		await page.keyboard.type( '...' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await editor.canvas.click( '[data-type="core/paragraph"] >> nth=0' );
		await page.keyboard.up( 'Shift' );
		await editor.transformBlockTo( 'core/list' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.clickBlockToolbarButton( 'Select List' );
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
		await pageUtils.pressKeys( 'ArrowUp', { times: 4 } );
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
		await editor.clickBlockToolbarButton( 'Select List' );
		await editor.transformBlockTo( 'core/quote' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:list -->
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '1. one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
<li>one</li>
<!-- /wp:list-item --></ol>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
<li>one<!-- wp:list -->
<ul><!-- wp:list-item -->
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

	test( 'should be immeadiately saved on indentation', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await editor.clickBlockToolbarButton( 'Indent' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>one<!-- wp:list -->
<ul><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should change the base list type', async ( { editor } ) => {
		await editor.insertBlock( { name: 'core/list' } );
		await editor.clickBlockToolbarButton( 'Select List' );
		await editor.clickBlockToolbarButton( 'Ordered' );
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
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
		await editor.clickBlockToolbarButton( 'Select List' );
		await editor.clickBlockToolbarButton( 'Ordered' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>a<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
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
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'aaa' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:list -->
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await editor.clickBlockToolbarButton( 'Outdent' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should indent and outdent level 2', async ( { editor, page } ) => {
		// To do: run with iframe.
		await page.evaluate( () => {
			window.wp.blocks.registerBlockType( 'test/v2', {
				apiVersion: '2',
				title: 'test',
			} );
		} );
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
<ul><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul><!-- wp:list-item -->
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

	test( 'should outdent with children', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
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
<ul><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>b<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await pageUtils.pressKeys( 'ArrowUp', { times: 3 } );
		await editor.clickBlockToolbarButton( 'Outdent' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>b<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
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
		await pageUtils.pressKeys( 'shift+Enter' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );

		await page.keyboard.type( '* 1' ); // Should be at level 0.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' a' ); // Should be at level 1.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' i' ); // Should be at level 2.

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>a<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>i</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' ); // Should be at level 1.

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should be at level 0.

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should be at level 1.

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list --></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' ); // Should be at level 0.

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' ); // Should be at level 0.

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' ); // Should remove list.

		await expect.poll( editor.getEditedPostContent ).toBe( '' );

		// That's 9 key presses to create the list, and 9 key presses to remove
		// the list. ;)
	} );

	test( 'should place the caret in the right place with nested list', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( ' a' );
		await pageUtils.pressKeys( 'ArrowUp', { times: 2 } );
		await page.keyboard.press( 'Enter' );
		// The caret should land in the second item.
		await page.keyboard.type( '2' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>2<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );

		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await pageUtils.pressKeys( 'shift+Space' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );

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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );

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
<ul><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
<li>1<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
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
<ul><!-- wp:list-item -->
<li>2</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->`
		);
	} );

	test( 'should not change the contents when you change the list type to Ordered', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '* 1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '3' );
		await editor.clickBlockToolbarButton( 'Select List' );
		await editor.clickBlockToolbarButton( 'Ordered' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list {"ordered":true} -->
<ol><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '1. a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'c' );
		await editor.clickBlockToolbarButton( 'Select List' );
		await editor.clickBlockToolbarButton( 'Unordered' );

		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:list -->
<ul><!-- wp:list-item -->
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
<ul><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );

		// Go back to normal editor
		await pageUtils.pressKeys( 'secondary+M' ); // Emulates CTRL+Shift+Alt + M => toggle code editor

		// Verify no WSOD and content is proper.
		expect( await editor.getEditedPostContent() ).toBe( `<!-- wp:list -->
<ul><!-- wp:list-item -->
<li></li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );
	} );

	test( 'should merge two list with same attributes', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '* a' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'b' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '* c' );

		await expect.poll( editor.getEditedPostContent ).toBe( `<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>a</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>b</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>c</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );

		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		await expect.poll( editor.getEditedPostContent ).toBe( `<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await editor.canvas.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '* ' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );

		expect( await editor.getEditedPostContent() ).toBe( `<!-- wp:list -->
<ul><!-- wp:list-item -->
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
		await page.getByRole( 'menuitem', { name: 'Paragraph' } ).click();

		expect( await editor.getEditedPostContent() )
			.toBe( `<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>2</p>
<!-- /wp:paragraph -->` );

		await page.getByRole( 'button', { name: 'Paragraph' } ).click();
		await page.getByRole( 'menuitem', { name: 'List' } ).click();

		expect( await editor.getEditedPostContent() ).toBe( `<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>1</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>2</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->` );
	} );

	test( 'should merge two list items with nested lists', async ( {
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
		} );

		// Navigate to the third item.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );

		await page.keyboard.press( 'Backspace' );

		// Test caret position.
		await page.keyboard.type( '‸' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
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
		] );
	} );
} );
