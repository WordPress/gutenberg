/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

function generateRandomNumber() {
	return Math.round( 1 + Math.random() * ( Number.MAX_SAFE_INTEGER - 1 ) );
}

test.describe( 'Taxonomies', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
	} );

	test( 'should be able to open the categories panel and create a new main category', async ( {
		editor,
		page,
	} ) => {
		// Open the Document -> Categories panel.
		const panelToggle = page.getByRole( 'button', {
			name: 'Categories',
		} );

		if (
			( await panelToggle.getAttribute( 'aria-expanded' ) ) === 'false'
		) {
			await panelToggle.click();
		}

		await page
			.getByRole( 'button', {
				name: 'Add New Category',
				expanded: false,
			} )
			.click();
		await page
			.getByRole( 'textbox', { name: 'New Category Name' } )
			.fill( 'z rand category 1' );
		await page.keyboard.press( 'Enter' );

		const categories = page.getByRole( 'group', { name: 'Categories' } );
		const selectedCategories = categories.getByRole( 'checkbox', {
			checked: true,
		} );
		const newCategory = categories.getByRole( 'checkbox', {
			name: 'z rand category 1',
		} );

		await expect( selectedCategories ).toHaveCount( 1 );
		await expect( newCategory ).toBeChecked();

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		await editor.publishPost();
		await page.reload();

		// The category selection was persisted after the publish process.
		await expect( selectedCategories ).toHaveCount( 1 );
		await expect( newCategory ).toBeChecked();
	} );

	test( 'should be able to open the tags panel and create a new tag', async ( {
		editor,
		page,
	} ) => {
		// Open the Document -> Tags panel.
		const panelToggle = page.getByRole( 'button', {
			name: 'Tags',
		} );

		if (
			( await panelToggle.getAttribute( 'aria-expanded' ) ) === 'false'
		) {
			await panelToggle.click();
		}

		const tagName = 'tag-' + generateRandomNumber();
		const tags = page.locator( '.components-form-token-field__token-text' );

		await page
			.getByRole( 'combobox', { name: 'Add New Tag' } )
			.fill( tagName );
		await page.keyboard.press( 'Enter' );

		await expect( tags ).toHaveCount( 1 );
		await expect( tags ).toContainText( tagName );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		await editor.publishPost();
		await page.reload();

		await expect( tags ).toHaveCount( 1 );
		await expect( tags ).toContainText( tagName );
	} );

	// See: https://github.com/WordPress/gutenberg/pull/21693.
	test( `should be able to create a new tag with ' on the name`, async ( {
		editor,
		page,
	} ) => {
		// Open the Document -> Tags panel.
		const panelToggle = page.getByRole( 'button', {
			name: 'Tags',
		} );

		if (
			( await panelToggle.getAttribute( 'aria-expanded' ) ) === 'false'
		) {
			await panelToggle.click();
		}

		const tagName = "tag'-" + generateRandomNumber();
		const tags = page.locator( '.components-form-token-field__token-text' );

		await page
			.getByRole( 'combobox', { name: 'Add New Tag' } )
			.fill( tagName );
		await page.keyboard.press( 'Enter' );

		await expect( tags ).toHaveCount( 1 );
		await expect( tags ).toContainText( tagName );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		await editor.publishPost();
		await page.reload();

		await expect( tags ).toHaveCount( 1 );
		await expect( tags ).toContainText( tagName );
	} );
} );
