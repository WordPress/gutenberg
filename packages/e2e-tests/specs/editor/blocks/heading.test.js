/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	getEditedPostContent,
	openColorToolsPanelMenu,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

const openColorToolsPanelMenu = async () => {
	const toggleSelector =
		"//div[contains(@class, 'color-block-support-panel')]//button[contains(@class, 'components-dropdown-menu__toggle')]";
	const toggle = await page.waitForXPath( toggleSelector );
	return toggle.click();
};

describe( 'Heading', () => {
	const COLOR_ITEM_SELECTOR =
		'.block-editor-panel-color-gradient-settings__dropdown';
	const CUSTOM_COLOR_BUTTON_X_SELECTOR = `.components-color-palette__custom-color`;
	const CUSTOM_COLOR_DETAILS_BUTTON_SELECTOR =
		'.components-color-picker button[aria-label="Show detailed inputs"]';
	const COLOR_INPUT_FIELD_SELECTOR =
		'.components-color-picker .components-input-control__input';

	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by prefixing number sign and a space', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '### 3' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by prefixing existing content with number signs and a space', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '4' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.type( '#### ' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should not work with the list input rule', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '## 1. H' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should work with the format input rules', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '## `code`' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should create a paragraph block above when pressing enter at the start', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should create a paragraph block below when pressing enter at the end', async () => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## a' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should correctly apply custom colors', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '### Heading' );
		await openColorToolsPanelMenu();
		await page.click( 'button[aria-label="Show Text"]' );

		const textColorButton = await page.waitForSelector(
			COLOR_ITEM_SELECTOR
		);
		await textColorButton.click();

		const customTextColorButton = await page.waitForSelector(
			CUSTOM_COLOR_BUTTON_X_SELECTOR
		);

		await customTextColorButton.click();
		await page.click( CUSTOM_COLOR_DETAILS_BUTTON_SELECTOR );
		await page.waitForSelector( COLOR_INPUT_FIELD_SELECTOR );
		await page.click( COLOR_INPUT_FIELD_SELECTOR );
		await pressKeyWithModifier( 'primary', 'A' );
		await page.keyboard.type( '0782f6' );
		await page.click( 'h3[data-type="core/heading"]' );
		await page.waitForXPath( '//button[text()="#0782f6"]' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should correctly apply named colors', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '## Heading' );
		await openColorToolsPanelMenu();
		await page.click( 'button[aria-label="Show Text"]' );

		const textColorButton = await page.waitForSelector(
			COLOR_ITEM_SELECTOR
		);
		await textColorButton.click();

		const colorButtonSelector = `//button[@aria-label='Color: Luminous vivid orange']`;
		const [ colorButton ] = await page.$x( colorButtonSelector );
		await colorButton.click();
		await page.waitForXPath(
			`${ colorButtonSelector }[@aria-pressed='true']`
		);
		await page.click( 'h2[data-type="core/heading"]' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
