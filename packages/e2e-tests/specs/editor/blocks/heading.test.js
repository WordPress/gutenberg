/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'Heading', () => {
	const CUSTOM_COLOR_TEXT = 'Custom color';
	const CUSTOM_COLOR_BUTTON_X_SELECTOR = `button:text("${ CUSTOM_COLOR_TEXT }")`;
	const COLOR_INPUT_FIELD_SELECTOR =
		'input:below(:text-matches("Color value"))';
	const COLOR_PANEL_TOGGLE_X_SELECTOR = 'button:has-text("Color")';

	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by prefixing number sign and a space', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '### 3' );

		await page.waitForSelector( 'h3:text-is("3")' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by prefixing existing content with number signs and a space', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'Home' );
		await page.keyboard.type( '#### ' );

		await page.waitForSelector( 'h4:text-is("4")' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not work with the list input rule', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '## 1. H' );

		await page.waitForSelector( 'h2:text-is("1. H")' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should work with the format input rules', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '## `code`' );

		await page.waitForSelector( 'h2 >> code:text-is("code")' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should create a paragraph block above when pressing enter at the start', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );

		await page.waitForSelector(
			'h2:text-is("a"):below(p[aria-label*="Empty block"])'
		);
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should create a paragraph block below when pressing enter at the end', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'Enter' );

		await page.waitForSelector(
			'p[aria-label*="Empty block"]:below(h2:text-is("a"))'
		);
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should correctly apply custom colors', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '### Heading' );

		await page.click( COLOR_PANEL_TOGGLE_X_SELECTOR );
		await page.click( CUSTOM_COLOR_BUTTON_X_SELECTOR );
		await page.fill( COLOR_INPUT_FIELD_SELECTOR, '#7700ff' );

		await page.waitForSelector(
			'h3[style*="rgb(119, 0, 255)"]:text-is("Heading")'
		);
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should correctly apply named colors', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '## Heading' );

		await page.click( COLOR_PANEL_TOGGLE_X_SELECTOR );
		await page.click( 'button[aria-label="Color: Luminous vivid orange"]' );

		await page.waitForSelector(
			'h2.has-luminous-vivid-orange-color:text-is("Heading")'
		);
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
