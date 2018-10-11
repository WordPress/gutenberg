/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	newPost,
	pressTimes,
	convertBlock,
	pressWithModifier,
	insertBlock,
} from '../support/utils';

describe( 'Lists', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'can be created by using an asterisk at the start of a paragraph block', async () => {
		// Create a block with some text that will trigger a list creation.
		await clickBlockAppender();
		await page.keyboard.type( '* A list item' );

		// Create a second list item.
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Another list item' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by typing an asterisk in front of text of a paragraph block', async () => {
		// Create a list with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await pressTimes( 'ArrowLeft', 4 );
		await page.keyboard.type( '* ' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by using a number at the start of a paragraph block', async () => {
		// Create a block with some text that will trigger a list creation.
		await clickBlockAppender();
		await page.keyboard.type( '1) A list item' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by typing "/list"', async () => {
		// Create a list with the slash block shortcut.
		await clickBlockAppender();
		await page.keyboard.type( '/list' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'I’m a list' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by converting a paragraph', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'test' );
		await convertBlock( 'List' );

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
		await convertBlock( 'List' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by converting a paragraph with line breaks', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'one' );
		await pressWithModifier( 'Shift', 'Enter' );
		await page.keyboard.type( 'two' );
		await convertBlock( 'List' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be converted to a paragraphs', async () => {
		await insertBlock( 'List' );
		await page.keyboard.type( 'one' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'two' );
		await convertBlock( 'Paragraph' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
