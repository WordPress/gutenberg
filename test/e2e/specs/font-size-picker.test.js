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

	it( 'should apply a named font size using the font size buttons', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "large"' );

		const largeButton = ( await page.$x( '//*[contains(concat(" ", @class, " "), " components-font-size-picker__buttons ")]//*[text()=\'L\']' ) )[ 0 ];
		await largeButton.click();

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should apply a named font size using the font size input', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.type( '14' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should apply a custom font size using the font size input', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.type( '23' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should reset a named font size using the reset button', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph with font size reset using button' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.type( '14' );

		const resetButton = ( await page.$x( '//*[contains(concat(" ", @class, " "), " components-font-size-picker__buttons ")]//*[text()=\'Reset\']' ) )[ 0 ];
		await resetButton.click();

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should reset a named font size using input field', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph with font size reset using input field' );

		const largeButton = ( await page.$x( '//*[contains(concat(" ", @class, " "), " components-font-size-picker__buttons ")]//*[text()=\'L\']' ) )[ 0 ];
		await largeButton.click();

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should reset a custom font size using input field', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.type( '23' );

		await page.keyboard.press( 'Backspace' );

		await page.click( '.blocks-font-size .components-range-control__number' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );
} );
