/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	createNewPost,
	pressKeyWithModifier,
	transformBlockTo,
	getEditedPostContent,
} from '@wordpress/e2e-test-utils';

describe( 'Keep styles on block transforms', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Should keep colors during a transform', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '## Heading' );
		const [ colorPanelToggle ] = await page.$x(
			"//button[./span[contains(text(),'Color')]]"
		);
		await colorPanelToggle.click();

		const textColorButton = await page.waitForSelector(
			'.block-editor-panel-color-gradient-settings__item'
		);
		await textColorButton.click();

		const colorButtonSelector = `//button[@aria-label='Color: Luminous vivid orange']`;
		const [ colorButton ] = await page.$x( colorButtonSelector );
		await colorButton.click();
		await page.waitForXPath(
			`${ colorButtonSelector }[@aria-pressed='true']`
		);
		await page.click( 'h2[data-type="core/heading"]' );
		await transformBlockTo( 'Paragraph' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'Should keep the font size during a transform from multiple blocks into a single one', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Line 1 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 2 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 3 to be made large' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		await page.click(
			'[role="radiogroup"][aria-label="Font size"] [aria-label="Large"]'
		);
		await transformBlockTo( 'List' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'Should keep the font size during a transform from multiple blocks into multiple blocks', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Line 1 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 2 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 3 to be made large' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pressKeyWithModifier( 'shift', 'ArrowUp' );
		await page.click(
			'[role="radiogroup"][aria-label="Font size"] [aria-label="Large"]'
		);
		await transformBlockTo( 'Heading' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'Should not include styles in the group block when grouping a block', async () => {
		// Create a paragraph block with some content.
		await clickBlockAppender();
		await page.keyboard.type( 'Line 1 to be made large' );
		await page.click(
			'[role="radiogroup"][aria-label="Font size"] [aria-label="Large"]'
		);
		await transformBlockTo( 'Group' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
