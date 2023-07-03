/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Pages', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor();
	} );

	test( 'create a new page', async ( { page, editor } ) => {
		// Draft a new page.
		await page.getByRole( 'button', { name: 'Pages' } ).click();
		await page.getByRole( 'button', { name: 'Draft a new page' } ).click();
		await page
			.locator( 'role=dialog[name="Draft a new page"i]' )
			.locator( 'role=textbox[name="Page title"i]' )
			.fill( 'Test Page' );
		await page.keyboard.press( 'Enter' );
		await expect(
			page.locator(
				`role=button[name="Dismiss this notice"i] >> text='"Test Page" successfully created.'`
			)
		).toBeVisible();

		// Insert into Page Content using default block.
		await editor.canvas
			.getByRole( 'document', {
				name: 'Empty block; start writing or type forward slash to choose a block',
			} )
			.fill( 'Lorem ipsum dolor sit amet' );

		// Insert into Page Content using global inserter.
		await page
			.getByRole( 'button', { name: 'Toggle block inserter' } )
			.click();
		await page
			.getByRole( 'option', { name: 'Heading', exact: true } )
			.click();
		await editor.canvas
			.getByRole( 'document', {
				name: 'Block: Heading',
			} )
			.fill( 'Lorem ipsum' );

		// Insert into Page Content using appender.
		await page
			.getByRole( 'region', { name: 'Editor footer' } )
			.getByRole( 'button', { name: 'Post Content' } )
			.click();
		await editor.canvas
			.getByRole( 'button', { name: 'Add block' } )
			.click();
		await page.getByPlaceholder( 'Search' ).fill( 'list' );
		await page.getByRole( 'option', { name: 'List', exact: true } ).click();
		await page.keyboard.type( 'Lorem ipsum' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Dolor sit amet' );

		// Selecting a block in the template should display a notice.
		await editor.canvas
			.getByRole( 'document', {
				name: 'Block: Site Title',
			} )
			.click( { force: true } );
		await expect(
			page.locator(
				'role=button[name="Dismiss this notice"i] >> text="Edit your template to edit this block."'
			)
		).toBeVisible();

		// Switch to template editing focus.
		await page.getByRole( 'button', { name: 'Settings' } ).click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Edit template' } )
			.click();
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Post Content',
			} )
		).toContainText(
			'This is the Post Content block, it will display all the blocks in any single post or page.'
		);
		await expect(
			page.locator(
				'role=button[name="Dismiss this notice"i] >> text="You are editing a template."'
			)
		).toBeVisible();

		// Edit a block that's in the template.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Site title text' } )
			.fill( 'New Site Title' );

		// Go back to page editing focus.
		await page.getByRole( 'button', { name: 'Back', exact: true } ).click();

		// Site Title and Page entities should have been modified.
		await page.getByRole( 'button', { name: 'Save', exact: true } ).click();
		await expect(
			page.locator(
				'role=region[name="Save panel"] >> role=checkbox[name="Title"]'
			)
		).toBeVisible();
		await expect(
			page.locator(
				'role=region[name="Save panel"] >> role=checkbox[name="Test Page"]'
			)
		).toBeVisible();
	} );
} );
