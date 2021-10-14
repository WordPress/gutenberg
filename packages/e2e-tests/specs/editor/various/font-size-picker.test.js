/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

const FONT_SIZE_TOGGLE_GROUP_SELECTOR =
	"//div[contains(@class, 'components-font-size-picker__controls')]//div[contains(@class, 'components-toggle-group-control')]";

// Applies when ToggleGroupControl is used.
const getActiveButtonLabel = async () => {
	const buttonSelector = `${ FONT_SIZE_TOGGLE_GROUP_SELECTOR }//div[@data-active='true']//button`;
	const [ activeButton ] = await page.$x( buttonSelector );
	return page.evaluate(
		( element ) => element?.getAttribute( 'aria-label' ),
		activeButton
	);
};

// Click a button by its label - applies when ToggleGroupControl is used.
const clickFontSizeButtonByLabel = async ( label ) => {
	const buttonSelector = `${ FONT_SIZE_TOGGLE_GROUP_SELECTOR }//button[@aria-label='${ label }']`;
	const button = await page.waitForXPath( buttonSelector );
	return button.click();
};

// Clicks the button to toggle between custom size input and the control for the presets.
const toggleCustomInput = async ( showCustomInput ) => {
	const label = showCustomInput ? 'Set custom size' : 'Use size preset';
	const toggleButton = await page.waitForXPath(
		`//button[@aria-label='${ label }']`
	);
	return toggleButton.click();
};

const clickCustomInput = async () => {
	const customInput = await page.waitForXPath(
		"//input[@aria-label='Custom']"
	);
	return customInput.click();
};

describe( 'Font Size Picker', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should apply a named font size using the font size buttons', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "large"' );

		await clickFontSizeButtonByLabel( 'Large' );
		expect( await getActiveButtonLabel() ).toEqual( 'Large' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {\\"fontSize\\":\\"large\\"} -->
		<p class=\\"has-large-font-size\\">Paragraph to be made \\"large\\"</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should apply a named font size using the font size input', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await toggleCustomInput( true );
		await clickCustomInput();
		// This should be the "small" font-size of the editor defaults.
		await page.keyboard.type( '13' );
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {\\"fontSize\\":\\"small\\"} -->
		<p class=\\"has-small-font-size\\">Paragraph to be made \\"small\\"</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should apply a custom font size using the font size input', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await toggleCustomInput( true );
		await clickCustomInput();
		await page.keyboard.type( '23' );
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph {\\"style\\":{\\"typography\\":{\\"fontSize\\":\\"23px\\"}}} -->
		<p style=\\"font-size:23px\\">Paragraph to be made \\"small\\"</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should reset a named font size using the reset button', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type(
			'Paragraph with font size reset using button'
		);

		await clickFontSizeButtonByLabel( 'Small' );
		await toggleCustomInput( true );

		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );

		await page.keyboard.press( 'Enter' );
		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>Paragraph with font size reset using button</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should reset a named font size using input field', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type(
			'Paragraph with font size reset using input field'
		);

		await clickFontSizeButtonByLabel( 'Small' );
		await toggleCustomInput( true );
		await clickCustomInput();
		await pressKeyWithModifier( 'primary', 'A' );
		await page.keyboard.press( 'Backspace' );

		// Disable reason: Wait for changes to apply.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitForTimeout( 1000 );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>Paragraph with font size reset using input field</p>
		<!-- /wp:paragraph -->"
	` );
	} );

	it( 'should reset a custom font size using input field', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Paragraph to be made "small"' );

		await toggleCustomInput( true );
		await clickCustomInput();
		await page.keyboard.type( '23' );
		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
		"<!-- wp:paragraph -->
		<p>Paragraph to be made \\"small\\"</p>
		<!-- /wp:paragraph -->"
	` );
	} );
} );
