/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	newPost,
	convertBlock,
	insertBlock,
} from '../../support/utils';

describe( 'Pullquote', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'can be created by typing "/pullquote"', async () => {
		// Create a list with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/pullquote' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'I’m a pullquote' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by converting a paragraph', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await convertBlock( 'Pullquote' );

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
		await convertBlock( 'Pullquote' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	describe( 'can be converted to paragraphs', async () => {
		it( 'and renders one paragraph block per <p> within the quote', async () => {
			await insertBlock( 'Pullquote' );
			await page.keyboard.type( 'one' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'two' );
			await convertBlock( 'Paragraph' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'and renders a paragraph for the cite, if it exists', async () => {
			await insertBlock( 'Pullquote' );
			await page.keyboard.type( 'one' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'two' );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( 'cite' );
			await convertBlock( 'Paragraph' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'and renders only one paragraph for the cite, if the quote is void', async () => {
			await insertBlock( 'Pullquote' );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( 'cite' );
			await convertBlock( 'Paragraph' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );

		it( 'and renders a void paragraph if both the cite and quote are void', async () => {
			await insertBlock( 'Pullquote' );
			await convertBlock( 'Paragraph' );

			expect( await getEditedPostContent() ).toMatchSnapshot();
		} );
	} );

	it( 'can be converted to a quote', async () => {
		await insertBlock( 'Pullquote' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'cite' );
		await convertBlock( 'Quote' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
