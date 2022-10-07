/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	pressKeyTimes,
	transformBlockTo,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Quote', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by using > at the start of a paragraph block', async () => {
		// Create a block with some text that will trigger a list creation.
		await clickBlockAppender();
		await page.keyboard.type( '> A quote' );

		// Create a second list item.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Another paragraph' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by typing > in front of text of a paragraph block', async () => {
		// Create a list with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await pressKeyTimes( 'ArrowLeft', 4 );
		await page.keyboard.type( '> ' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by typing "/quote"', async () => {
		// Create a list with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/quote' );
		await page.waitForXPath(
			`//*[contains(@class, "components-autocomplete__result") and contains(@class, "is-selected") and contains(text(), 'Quote')]`
		);
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'I’m a quote' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by converting a paragraph', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await transformBlockTo( 'Quote' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by converting multiple paragraphs', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.down( 'Shift' );
		await page.click( '[data-type="core/paragraph"]' );
		await page.keyboard.up( 'Shift' );
		await transformBlockTo( 'Quote' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	describe( 'can be converted to paragraphs', () => {
		it( 'and renders one paragraph block per <p> within quote', async () => {
			await insertBlock( 'Quote' );
			await page.keyboard.type( 'one' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'two' );
			// Navigate to the citation to select the block.
			await page.keyboard.press( 'ArrowRight' );
			await transformBlockTo( 'Unwrap' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'and renders a paragraph for the cite, if it exists', async () => {
			await insertBlock( 'Quote' );
			await page.keyboard.type( 'one' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'two' );
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.type( 'cite' );
			await transformBlockTo( 'Unwrap' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'and renders only one paragraph for the cite, if the quote is void', async () => {
			await insertBlock( 'Quote' );
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.type( 'cite' );
			await transformBlockTo( 'Unwrap' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'and renders a void paragraph if both the cite and quote are void', async () => {
			await insertBlock( 'Quote' );
			await page.keyboard.press( 'ArrowRight' ); // Select the quote
			await transformBlockTo( 'Unwrap' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	it( 'can be created by converting a heading', async () => {
		await insertBlock( 'Heading' );
		await page.keyboard.type( 'test' );
		await transformBlockTo( 'Quote' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be converted to a pullquote', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( 'cite' );
		await transformBlockTo( 'Pullquote' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be split at the end', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		// Expect empty paragraph outside quote block.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );
		// Allow time for selection to update.
		await page.evaluate( () => new Promise( window.requestIdleCallback ) );
		await page.keyboard.type( '2' );

		// Expect the paragraph to be merged into the quote block.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be unwrapped on Backspace', async () => {
		await insertBlock( 'Quote' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:quote -->
		<blockquote class=\\"wp-block-quote\\"><!-- wp:paragraph -->
		<p></p>
		<!-- /wp:paragraph --></blockquote>
		<!-- /wp:quote -->"
	` );

		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `""` );
	} );

	it( 'can be unwrapped with content on Backspace', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'ArrowRight' );
		await page.keyboard.type( '2' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:quote -->
		<blockquote class=\\"wp-block-quote\\"><!-- wp:paragraph -->
		<p>1</p>
		<!-- /wp:paragraph --><cite>2</cite></blockquote>
		<!-- /wp:quote -->"
	` );

		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>1</p>
		<!-- /wp:paragraph -->

		<!-- wp:paragraph -->
		<p>2</p>
		<!-- /wp:paragraph -->"
	` );
	} );
} );
