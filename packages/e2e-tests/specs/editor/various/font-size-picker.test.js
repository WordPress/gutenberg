/**
 * External dependencies
 */
import { first } from 'lodash';

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
	const FONT_SIZE_LABEL_SELECTOR = "//label[contains(text(), 'Font size')]";
	const CUSTOM_FONT_SIZE_LABEL_SELECTOR =
		"//fieldset[legend[contains(text(),'Font size')]]//label[contains(text(), 'Custom')]";
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should apply a named font size using the font size buttons', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "large"' );
		await first( await page.$x( FONT_SIZE_LABEL_SELECTOR ) ).click();
		await pressKeyTimes( 'ArrowDown', 4 );
		await page.keyboard.press( 'Enter' );
		const selectedFontSize = await page.evaluate(
			( selector ) =>
				document
					.evaluate(
						selector,
						document,
						null,
						XPathResult.ANY_TYPE,
						null
					)
					.iterateNext().control.textContent,
			FONT_SIZE_LABEL_SELECTOR
		);

		expect( selectedFontSize ).toBe( 'Large' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should apply a named font size using the font size input', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await first( await page.$x( CUSTOM_FONT_SIZE_LABEL_SELECTOR ) ).click();
		// This should be the "small" font-size of the editor defaults.
		await page.keyboard.type( '13' );
		await page.keyboard.press( 'Enter' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should apply a custom font size using the font size input', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await first( await page.$x( CUSTOM_FONT_SIZE_LABEL_SELECTOR ) ).click();
		await page.keyboard.type( '23' );
		await page.keyboard.press( 'Enter' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should reset a named font size using the reset button', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type(
			'Paragraph with font size reset using button'
		);

		await first( await page.$x( FONT_SIZE_LABEL_SELECTOR ) ).click();

		// Disable reason: Wait for changes to apply.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 100 );

		await pressKeyTimes( 'ArrowDown', 2 );
		await page.keyboard.press( 'Enter' );

		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		await page.keyboard.press( 'Enter' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should reset a named font size using input field', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type(
			'Paragraph with font size reset using input field'
		);

		await first( await page.$x( FONT_SIZE_LABEL_SELECTOR ) ).click();
		await pressKeyTimes( 'ArrowDown', 2 );
		await page.keyboard.press( 'Enter' );

		await first( await page.$x( CUSTOM_FONT_SIZE_LABEL_SELECTOR ) ).click();
		await pressKeyTimes( 'ArrowRight', 5 );
		await pressKeyTimes( 'Backspace', 5 );
		await page.keyboard.press( 'Enter' );

		// Disable reason: Wait for changes to apply.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 1000 );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );

	it( 'should reset a custom font size using input field', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await first( await page.$x( CUSTOM_FONT_SIZE_LABEL_SELECTOR ) ).click();
		await page.keyboard.type( '23' );
		await page.keyboard.press( 'Enter' );

		await first( await page.$x( CUSTOM_FONT_SIZE_LABEL_SELECTOR ) ).click();
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Enter' );

		// Ensure content matches snapshot.
		const content = await getEditedPostContent();
		expect( content ).toMatchSnapshot();
	} );
} );
