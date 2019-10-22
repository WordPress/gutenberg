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
			await transformBlockTo( 'Paragraph' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'and renders a paragraph for the cite, if it exists', async () => {
			await insertBlock( 'Quote' );
			await page.keyboard.type( 'one' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'two' );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( 'cite' );
			await transformBlockTo( 'Paragraph' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'and renders only one paragraph for the cite, if the quote is void', async () => {
			await insertBlock( 'Quote' );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( 'cite' );
			await transformBlockTo( 'Paragraph' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'and renders a void paragraph if both the cite and quote are void', async () => {
			await insertBlock( 'Quote' );
			await transformBlockTo( 'Paragraph' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	it( 'can be created by converting a heading', async () => {
		await insertBlock( 'Heading' );
		await page.keyboard.type( 'test' );
		await transformBlockTo( 'Quote' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'is transformed to an empty heading if the quote is empty', async () => {
		await insertBlock( 'Quote' );
		await transformBlockTo( 'Heading' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'is transformed to a heading if the quote just contains one paragraph', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'one' );
		await transformBlockTo( 'Heading' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'is transformed to a heading and a quote if the quote contains multiple paragraphs', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'three' );
		await transformBlockTo( 'Heading' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'is transformed to a heading and a quote if the quote contains a citation', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'cite' );
		await transformBlockTo( 'Heading' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'the resuling quote after transforming to a heading can be transformed again', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'cite' );
		await transformBlockTo( 'Heading' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
		await page.click( '[data-type="core/quote"]' );
		await transformBlockTo( 'Heading' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
		await page.click( '[data-type="core/quote"]' );
		await transformBlockTo( 'Heading' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be converted to a pullquote', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'cite' );
		await transformBlockTo( 'Pullquote' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be merged into from a paragraph', async () => {
		await insertBlock( 'Quote' );
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'test' );
		await pressKeyTimes( 'ArrowLeft', 'test'.length );
		await page.keyboard.press( 'Backspace' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be split at the end and merged back', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		// Expect empty paragraph outside quote block.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );

		// Expect empty paragraph inside quote block.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );

		// Expect quote without empty paragraphs.
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be split in the middle and merged back', async () => {
		await insertBlock( 'Quote' );
		await page.keyboard.type( '1' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'c' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Enter' );

		// Expect two quote blocks and empty paragraph in the middle.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );

		// Expect two quote blocks and empty paragraph in the first quote.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Backspace' );

		// Expect two quote blocks.
		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
