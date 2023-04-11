/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Keep styles on block transforms', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Should keep colors during a transform', async ( {
		page,
		editor,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( '## Heading' );

		await page.click( 'role=button[name="Text"i]' );

		await page.click( 'role=button[name="Color: Luminous vivid orange"i]' );

		await page.mouse.move( 50, 50 );
		await page.mouse.move( 75, 75 );
		await page.mouse.move( 100, 100 );
		await page.click( 'role=button[name="Heading"i]' );
		await page.click(
			"button[class='components-button components-menu-item__button editor-block-list-item-paragraph'] span[class='components-menu-item__item']"
		);

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'Should keep the font size during a transform from multiple blocks into multiple blocks', async ( {
		page,
		pageUtils,
		editor,
	} ) => {
		// Create a paragraph block with some content.
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Line 1 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 2 to be made large' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Line 3 to be made large' );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await pageUtils.pressKeyWithModifier( 'shift', 'ArrowUp' );
		await page.click( 'role=radio[name="Large"i]' );
		await page.click( 'role=button[name="Paragraph"i]' );
		await page.click(
			"button[class='components-button components-menu-item__button editor-block-list-item-heading']"
		);
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'Should not include styles in the group block when grouping a block', async ( {
		page,
		editor,
	} ) => {
		// Create a paragraph block with some content.
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'Line 1 to be made large' );
		await page.click( 'role=radio[name="Large"i]' );
		await page.mouse.move( 50, 50 );
		await page.mouse.move( 75, 75 );
		await page.mouse.move( 100, 100 );
		await page.click( 'role=button[name="Paragraph"i]' );
		await page.click(
			"button[class='components-button components-menu-item__button editor-block-list-item-group']"
		);

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
