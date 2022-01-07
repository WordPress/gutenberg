/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	pressKeyWithModifier,
	pressKeyTimes,
	openTypographyToolsPanelMenu,
} from '@wordpress/e2e-test-utils';

const openFontSizeSelectControl = async () => {
	const selectControlSelector =
		"//div[contains(@class, 'components-font-size-picker__controls')]//button[contains(@class, 'components-custom-select-control__button')]";
	const selectControl = await page.waitForXPath( selectControlSelector );
	return selectControl.click();
};

const FONT_SIZE_TOGGLE_GROUP_SELECTOR =
	"//div[contains(@class, 'components-font-size-picker__controls')]//div[contains(@class, 'components-toggle-group-control')]";

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
	describe( 'Common', () => {
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
		it( 'should reset a custom font size using input field', async () => {
			// Create a paragraph block with some content.
			await clickBlockAppender();
			await page.keyboard.type( 'Paragraph reset - custom size' );

			await toggleCustomInput( true );
			await clickCustomInput();
			await page.keyboard.type( '23' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph {\\"style\\":{\\"typography\\":{\\"fontSize\\":\\"23px\\"}}} -->
			<p style=\\"font-size:23px\\">Paragraph reset - custom size</p>
			<!-- /wp:paragraph -->"
		` );

			await pressKeyTimes( 'Backspace', 2 );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph -->
			<p>Paragraph reset - custom size</p>
			<!-- /wp:paragraph -->"
		` );
		} );
	} );

	// A different control is rendered based on the available font sizes number.
	describe( 'More font sizes', () => {
		beforeEach( async () => {
			await page.evaluate( () => {
				wp.data.dispatch( 'core/block-editor' ).updateSettings(
					// eslint-disable-next-line no-undef
					lodash.merge(
						wp.data.select( 'core/block-editor' ).getSettings(),
						{
							__experimentalFeatures: {
								typography: {
									fontSizes: {
										default: [
											{
												name: 'Tiny',
												slug: 'tiny',
												size: '11px',
											},
											,
											{
												name: 'Small',
												slug: 'small',
												size: '13px',
											},
											{
												name: 'Medium',
												slug: 'medium',
												size: '20px',
											},
											{
												name: 'Large',
												slug: 'large',
												size: '36px',
											},
											{
												name: 'Extra Large',
												slug: 'x-large',
												size: '42px',
											},
											{
												name: 'Huge',
												slug: 'huge',
												size: '48px',
											},
										],
									},
								},
							},
						}
					)
				);
			} );
		} );

		it( 'should apply a named font size using the font size buttons', async () => {
			// Create a paragraph block with some content.
			await clickBlockAppender();
			await page.keyboard.type( 'Paragraph to be made "large"' );

			await openFontSizeSelectControl();
			await pressKeyTimes( 'ArrowDown', 5 );
			await page.keyboard.press( 'Enter' );

			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph {\\"fontSize\\":\\"large\\"} -->
			<p class=\\"has-large-font-size\\">Paragraph to be made \\"large\\"</p>
			<!-- /wp:paragraph -->"
		` );
		} );
		it( 'should reset a named font size using the tools panel menu', async () => {
			// Create a paragraph block with some content.
			await clickBlockAppender();
			await page.keyboard.type(
				'Paragraph with font size reset using tools panel menu'
			);

			await openFontSizeSelectControl();
			await pressKeyTimes( 'ArrowDown', 4 );
			await page.keyboard.press( 'Enter' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph {\\"fontSize\\":\\"medium\\"} -->
			<p class=\\"has-medium-font-size\\">Paragraph with font size reset using tools panel menu</p>
			<!-- /wp:paragraph -->"
		` );

			// Open Typography ToolsPanel, font size will be first in menu and gain focus.
			await openTypographyToolsPanelMenu();

			await page.keyboard.press( 'Enter' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph -->
			<p>Paragraph with font size reset using tools panel menu</p>
			<!-- /wp:paragraph -->"
		` );
		} );

		it( 'should reset a named font size using input field', async () => {
			// Create a paragraph block with some content.
			await clickBlockAppender();
			await page.keyboard.type(
				'Paragraph with font size reset using input field'
			);

			await openFontSizeSelectControl();
			await pressKeyTimes( 'ArrowDown', 3 );
			await page.keyboard.press( 'Enter' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph {\\"fontSize\\":\\"small\\"} -->
			<p class=\\"has-small-font-size\\">Paragraph with font size reset using input field</p>
			<!-- /wp:paragraph -->"
		` );

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
	} );
	describe( 'Few font sizes', () => {
		it( 'should apply a named font size using the font size buttons', async () => {
			// Create a paragraph block with some content.
			await clickBlockAppender();
			await page.keyboard.type( 'Paragraph to be made "large"' );

			await clickFontSizeButtonByLabel( 'Large' );
			const buttonSelector = `${ FONT_SIZE_TOGGLE_GROUP_SELECTOR }//div[@data-active='true']//button`;
			const [ activeButton ] = await page.$x( buttonSelector );
			const activeLabel = await page.evaluate(
				( element ) => element?.getAttribute( 'aria-label' ),
				activeButton
			);
			expect( activeLabel ).toEqual( 'Large' );

			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph {\\"fontSize\\":\\"large\\"} -->
			<p class=\\"has-large-font-size\\">Paragraph to be made \\"large\\"</p>
			<!-- /wp:paragraph -->"
		` );
		} );

		it( 'should reset a named font size using the tools panel menu', async () => {
			// Create a paragraph block with some content.
			await clickBlockAppender();
			await page.keyboard.type(
				'Paragraph with font size reset using tools panel menu'
			);

			await clickFontSizeButtonByLabel( 'Small' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph {\\"fontSize\\":\\"small\\"} -->
			<p class=\\"has-small-font-size\\">Paragraph with font size reset using tools panel menu</p>
			<!-- /wp:paragraph -->"
		` );

			// Open Typography ToolsPanel, font size will be first in menu and gain focus.
			await openTypographyToolsPanelMenu();

			await page.keyboard.press( 'Enter' );
			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph -->
			<p>Paragraph with font size reset using tools panel menu</p>
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
			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
			"<!-- wp:paragraph {\\"fontSize\\":\\"small\\"} -->
			<p class=\\"has-small-font-size\\">Paragraph with font size reset using input field</p>
			<!-- /wp:paragraph -->"
		` );

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
	} );
} );
