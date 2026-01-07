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
				name: 'Add Category',
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

		await page.getByRole( 'combobox', { name: 'Add tag' } ).fill( tagName );
		await page.keyboard.press( 'Enter' );

		await expect( tags ).toHaveCount( 1 );
		await expect( tags ).toContainText( tagName );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		await editor.publishPost();

		// Wait for the tag to be saved via API before reloading
		await page.waitForResponse(
			( response ) =>
				response.url().includes( '/wp/v2/tags' ) &&
			    response.request().method() === 'POST' &&
				response.status() === 201
		);
		await page.reload();

		await expect( tags ).toHaveCount( 1 );
		await expect( tags ).toContainText( tagName );
	} );

    test( 'should be able to create multiple tags in rapid succession', async ( {
        editor,
        page,
    } ) => {
        const panelToggle = page.getByRole( 'button', {
            name: 'Tags',
        } );

        if (
            ( await panelToggle.getAttribute( 'aria-expanded' ) ) === 'false'
        ) {
            await panelToggle.click();
        }

        const tags = page.locator( '.components-form-token-field__token-text' );
        const input = page.getByRole( 'combobox', { name: 'Add tag' } );
		const rnd = generateRandomNumber(); 
        const tagNames = [ `Tag A ${ rnd }`, `Tag B ${ rnd }`, `Tag C ${ rnd }` ];
    
        for ( const tagName of tagNames ) {
            await input.fill( tagName );
            await page.keyboard.press( 'Enter' );
        }

        await expect( tags ).toHaveCount( 3 );

        await editor.canvas
            .getByRole( 'textbox', { name: 'Add title' } )
            .fill( 'Rapid Tags Test' );
        await editor.publishPost();
        await page.reload();

        const newPanelToggle = page.getByRole( 'button', { name: 'Tags' } );
        if (
            ( await newPanelToggle.getAttribute( 'aria-expanded' ) ) === 'false'
        ) {
            await newPanelToggle.click();
        }

        await expect( tags ).toHaveCount( 3 );
        await expect( tags ).toContainText( tagNames );
    } );
});