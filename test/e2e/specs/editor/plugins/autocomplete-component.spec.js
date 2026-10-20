const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Autocomplete component', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-autocomplete-component'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-autocomplete-component'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'completes text in a plain contenteditable', async ( { page } ) => {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Autocomplete component' } )
			.click();
		const field = page.getByRole( 'textbox', {
			name: 'Autocomplete field',
		} );
		await field.click();
		await page.keyboard.type( 'Fruit ~Or' );

		const listbox = page.getByRole( 'listbox' );
		await expect(
			listbox.getByRole( 'option', { name: '🍊 Orange' } )
		).toBeVisible();
		await expect( listbox.getByRole( 'option' ) ).toHaveCount( 1 );

		// The list is anchored to the caret, above the field's text line.
		const fieldBox = await field.boundingBox();
		const listBox = await listbox.boundingBox();
		expect( listBox.y + listBox.height ).toBeLessThanOrEqual(
			fieldBox.y + 8
		);
		expect( listBox.y + listBox.height ).toBeGreaterThan( fieldBox.y - 60 );
		expect( listBox.x ).toBeGreaterThanOrEqual( fieldBox.x );
		expect( listBox.x ).toBeLessThan( fieldBox.x + fieldBox.width );

		await page.keyboard.press( 'Enter' );
		await expect( listbox ).toBeHidden();
		await expect( field ).toHaveText( 'Fruit 🍊' );

		await page.keyboard.type( ' ~Ap' );
		await expect(
			listbox.getByRole( 'option', { name: '🍎 Apple' } )
		).toBeVisible();
		await page.keyboard.press( 'Escape' );
		await expect( listbox ).toBeHidden();
		await expect( field ).toHaveText( 'Fruit 🍊 ~Ap' );
	} );
} );
