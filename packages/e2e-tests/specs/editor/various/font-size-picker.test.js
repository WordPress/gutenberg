/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	pressKeyTimes,
} from '@wordpress/e2e-test-utils';

describe( 'Font Size Picker', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should apply a named font size using the font size buttons', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "large"' );
		await page.click( '.components-font-size-picker__select' );
		await page.click( '.components-custom-select-control__item:nth-child(5)' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should apply a named font size using the font size input', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await page.click( '.components-font-size-picker__controls .components-range-control__number' );
		// This should be the "small" font-size of the editor defaults.
		await page.keyboard.type( '13' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should apply a custom font size using the font size input', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await page.click( '.components-font-size-picker__controls .components-range-control__number' );
		await page.keyboard.type( '23' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should reset a named font size using the reset button', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph with font size reset using button' );

		await page.click( '.components-font-size-picker__select' );
		await page.click( '.components-custom-select-control__item:nth-child(2)' );

		const resetButton = ( await page.$x( '//*[contains(concat(" ", @class, " "), " components-font-size-picker__controls ")]//*[text()=\'Reset\']' ) )[ 0 ];
		await resetButton.click();

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should reset a named font size using input field', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph with font size reset using input field' );

		await page.click( '.components-font-size-picker__select' );
		await page.click( '.components-custom-select-control__item:nth-child(3)' );

		// Clear the custom font size input.
		await page.click( '.components-font-size-picker__controls .components-range-control__number' );
		await pressKeyTimes( 'ArrowRight', 5 );
		await pressKeyTimes( 'Backspace', 5 );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should reset a custom font size using input field', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await page.click( '.components-font-size-picker__controls .components-range-control__number' );
		await page.keyboard.type( '23' );

		await page.keyboard.press( 'Backspace' );

		await page.click( '.components-font-size-picker__controls .components-range-control__number' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );
} );
