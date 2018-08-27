/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	newPost,
} from '../support/utils';

describe( 'Font Size Picker', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'Should apply a named font size using the font size buttons', async () => {
		// Creating a paragraph block with some content
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "large"' );

		const largeButton = ( await page.$x( '//*[contains(concat(" ", @class, " "), " components-font-size-picker__buttons ")]//*[text()=\'L\']' ) )[ 0 ];
		await largeButton.click();
		// Check content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'Should apply a named font size using the font size input', async () => {
		// Creating a paragraph block with some content
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.type( '14' );
		// Check content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'Should apply a custom font size using the font size input', async () => {
		// Creating a paragraph block with some content
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.type( '23' );
		// Check content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'Should reset a named font size using the reset button', async () => {
		// Creating a paragraph block with some content
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph with font size reset using button' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.type( '14' );

		const resetButton = ( await page.$x( '//*[contains(concat(" ", @class, " "), " components-font-size-picker__buttons ")]//*[text()=\'Reset\']' ) )[ 0 ];
		await resetButton.click();

		// Check content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'Should reset a named font size using input field', async () => {
		// Creating a paragraph block with some content
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph with font size reset using input field' );

		const largeButton = ( await page.$x( '//*[contains(concat(" ", @class, " "), " components-font-size-picker__buttons ")]//*[text()=\'L\']' ) )[ 0 ];
		await largeButton.click();

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Check content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'Should reset a custom font size using input field', async () => {
		// Creating a paragraph block with some content
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.type( '23' );

		await page.keyboard.press( 'Backspace' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );
		// Check content
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );
} );
