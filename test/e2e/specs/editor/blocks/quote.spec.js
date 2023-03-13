/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Quote', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'should allow the user to type right away', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/quote' } );
		// Type content right after.
		await page.keyboard.type( 'Quote content' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>Quote content</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test( 'can be created by using > at the start of a paragraph block', async ( {
		editor,
		page,
	} ) => {
		// Create a block with some text that will trigger a paragraph creation.
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '> A quote' );
		// Create a second paragraph.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Another paragraph' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>A quote</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Another paragraph</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test( 'can be created by typing > in front of text of a paragraph block', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'test' );
		await pageUtils.pressKeyTimes( 'ArrowLeft', 'test'.length );
		await page.keyboard.type( '> ' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>test</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test( 'can be created by typing "/quote"', async ( { editor, page } ) => {
		// Create a list with the slash block shortcut.
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '/quote' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'I’m a quote' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>I’m a quote</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test( 'can be created by converting a paragraph', async ( {
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'test' );
		await editor.transformBlockTo( 'core/quote' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>test</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test( 'can be created by converting multiple paragraphs', async ( {
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await page.click(
			'role=document[name="Paragraph block"i] >> text=one'
		);
		await page.keyboard.up( 'Shift' );
		await editor.transformBlockTo( 'core/quote' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>one</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>two</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test.describe( 'can be converted to paragraphs', () => {
		test( 'and renders one paragraph block per <p> within quote', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/quote' } );
			await page.keyboard.type( 'one' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'two' );
			// Navigate to the citation to select the block.
			await page.keyboard.press( 'ArrowRight' );
			// Unwrap the block.
			await editor.transformBlockTo( '*' );
			expect( await editor.getEditedPostContent() ).toBe(
				`<!-- wp:paragraph -->
<p>one</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>two</p>
<!-- /wp:paragraph -->`
			);
		} );

		test( 'and renders a paragraph for the cite, if it exists', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/quote' } );
			await page.keyboard.type( 'one' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'two' );
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.type( 'cite' );
			// Unwrap the block.
			await editor.transformBlockTo( '*' );
			expect( await editor.getEditedPostContent() ).toBe(
				`<!-- wp:paragraph -->
<p>one</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>two</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>cite</p>
<!-- /wp:paragraph -->`
			);
		} );

		test( 'and renders only one paragraph for the cite, if the quote is void', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/quote' } );
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.type( 'cite' );
			// Unwrap the block.
			await editor.transformBlockTo( '*' );
			expect( await editor.getEditedPostContent() ).toBe(
				`<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>cite</p>
<!-- /wp:paragraph -->`
			);
		} );

		test( 'and renders a void paragraph if both the cite and quote are void', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/quote' } );
			// Select the quote
			await page.keyboard.press( 'ArrowRight' );
			// Unwrap the block.
			await editor.transformBlockTo( '*' );
			expect( await editor.getEditedPostContent() ).toBe( '' );
		} );
	} );

	test( 'can be created by converting a heading', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/heading' } );
		await page.keyboard.type( 'test' );
		await editor.transformBlockTo( 'core/quote' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:heading -->
<h2 class="wp-block-heading">test</h2>
<!-- /wp:heading --></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test( 'can be converted to a pullquote', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/quote' } );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'cite' );
		await editor.transformBlockTo( 'core/pullquote' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>one<br>two</p><cite>cite</cite></blockquote></figure>
<!-- /wp:pullquote -->`
		);
	} );

	test( 'can be split at the end', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/quote' } );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );
		// Expect empty paragraph outside quote block.
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph -->`
		);
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.type( '2' );
		// Expect the paragraph to be merged into the quote block.
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>2</p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
	} );

	test( 'can be unwrapped on Backspace', async ( { editor, page } ) => {
		await editor.insertBlock( { name: 'core/quote' } );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p></p>
<!-- /wp:paragraph --></blockquote>
<!-- /wp:quote -->`
		);
		await page.keyboard.press( 'Backspace' );
		expect( await editor.getEditedPostContent() ).toBe( '' );
	} );

	test( 'can be unwrapped with content on Backspace', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( { name: 'core/quote' } );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '2' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:quote -->
<blockquote class="wp-block-quote"><!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph --><cite>2</cite></blockquote>
<!-- /wp:quote -->`
		);
		// Move the cursor to the start of the first paragraph of the quoted block.
		await pageUtils.pressKeyTimes( 'ArrowLeft', 4 );
		await page.keyboard.press( 'Backspace' );
		expect( await editor.getEditedPostContent() ).toBe(
			`<!-- wp:paragraph -->
<p>1</p>
<!-- /wp:paragraph -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><cite>2</cite></blockquote>
<!-- /wp:quote -->`
		);
	} );
} );
