/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block variations', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-variations' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-block-variations'
		);
	} );

	test( 'Search for the overridden default Quote block', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		await page
			.getByRole( 'region', { name: 'Block Library' } )
			.getByRole( 'searchbox', {
				name: 'Search',
			} )
			.fill( 'Quote' );

		await expect(
			page
				.getByRole( 'listbox', { name: 'Blocks' } )
				.getByRole( 'option', { name: 'Quote', exact: true } )
		).toBeHidden();
		await expect(
			page
				.getByRole( 'listbox', { name: 'Blocks' } )
				.getByRole( 'option', { name: 'Large Quote' } )
		).toBeVisible();
	} );

	test( 'Insert the overridden default Quote block variation', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/Large Quote' );
		await page.keyboard.press( 'Enter' );

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Quote' } )
		).toHaveClass( /is-style-large/ );
	} );

	test( 'Search for the Paragraph block with 2 additional variations', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		await page
			.getByRole( 'region', { name: 'Block Library' } )
			.getByRole( 'searchbox', {
				name: 'Search',
			} )
			.fill( 'Paragraph' );

		await expect(
			page
				.getByRole( 'listbox', { name: 'Blocks' } )
				.getByRole( 'option' )
		).toHaveText( [ 'Paragraph', 'Success Message', 'Warning Message' ] );
	} );

	test( 'Insert the Success Message block variation', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/Heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/Success Message' );
		await page.keyboard.press( 'Enter' );

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'This is a success message!' );
	} );

	test( 'Pick the additional variation in the inserted Columns block', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/Columns' );
		await page.keyboard.press( 'Enter' );

		await editor.canvas
			.getByRole( 'list', { name: 'Block variations' } )
			.getByRole( 'button', { name: 'Four columns' } )
			.click();

		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Columns' } )
				.getByRole( 'document' )
		).toHaveCount( 4 );
	} );

	// Tests the `useBlockDisplayInformation` hook.
	test( 'should show block information when no matching variation is found', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/Large Quote' );
		await page.keyboard.press( 'Enter' );

		// Select the quote block.
		await page.keyboard.press( 'ArrowUp' );

		await expect(
			page
				.getByRole( 'list', { name: 'Block breadcrumb' } )
				.getByRole( 'listitem' )
				.filter( { hasText: 'Quote' } )
		).toHaveAttribute( 'aria-current', 'true' );

		await pageUtils.pressKeys( 'access+o' );

		await expect(
			page
				.getByRole( 'treegrid', { name: 'Block navigation structure' } )
				.getByRole( 'link' )
		).toHaveText( 'Quote' );

		await expect(
			page.locator( '.block-editor-block-card__description' )
		).toHaveText(
			'Give quoted text visual emphasis. "In quoting others, we cite ourselves." — Julio Cortázar'
		);
	} );

	test( 'should display variations info if all declared', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/Heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/Success Message' );
		await page.keyboard.press( 'Enter' );

		await expect(
			page
				.getByRole( 'list', { name: 'Block breadcrumb' } )
				.getByRole( 'listitem' )
				.filter( { hasText: 'Success Message' } )
		).toHaveAttribute( 'aria-current', 'true' );

		await pageUtils.pressKeys( 'access+o' );

		await expect(
			page
				.getByRole( 'treegrid', { name: 'Block navigation structure' } )
				.getByRole( 'link' )
		).toHaveText( 'Success Message' );

		await expect(
			page.locator( '.block-editor-block-card__description' )
		).toHaveText(
			'This block displays a success message. This description overrides the default one provided for the Paragraph block.'
		);
	} );

	test( 'should display mixed block and variation match information', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		await editor.canvas
			.locator( 'role=button[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/Heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/Warning Message' );
		await page.keyboard.press( 'Enter' );

		await expect(
			page
				.getByRole( 'list', { name: 'Block breadcrumb' } )
				.getByRole( 'listitem' )
				.filter( { hasText: 'Warning Message' } )
		).toHaveAttribute( 'aria-current', 'true' );

		await pageUtils.pressKeys( 'access+o' );

		await expect(
			page
				.getByRole( 'treegrid', {
					name: 'Block navigation structure',
				} )
				.getByRole( 'link' )
		).toHaveText( 'Warning Message' );

		// Warning Message variation is missing the `description`.
		await expect(
			page.locator( '.block-editor-block-card__description' )
		).toHaveText( 'Start with the basic building block of all narrative.' );
	} );
} );
