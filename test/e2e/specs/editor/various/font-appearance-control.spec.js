const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Font Appearance Control dropdown menu', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		// The tests read the block inspector, and the sidebar's visibility is
		// a persisted user preference, so a preceding test that closed it
		// would otherwise leave these tests without an inspector.
		await editor.openDocumentSettingsSidebar();
	} );

	test( 'should apply available font weight and styles from active font family', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Regular',
				style: {
					typography: { fontWeight: '400', fontStyle: 'normal' },
				},
			},
		} );
		await page
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
		await expect(
			page.getByRole( 'combobox', { name: 'Appearance' } )
		).toHaveText( 'Regular' );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Extra Light Italic',
				style: {
					typography: { fontWeight: '200', fontStyle: 'italic' },
				},
			},
		} );
		await page
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
		await expect(
			page.getByRole( 'combobox', { name: 'Appearance' } )
		).toHaveText( 'Extra Light Italic' );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Bold Italic',
				style: {
					typography: { fontWeight: '700', fontStyle: 'italic' },
				},
			},
		} );
		await page
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
		await expect(
			page.getByRole( 'combobox', { name: 'Appearance' } )
		).toHaveText( 'Bold Italic' );
	} );

	test( 'should apply Default appearance if weight and style are invalid', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Default',
				style: {
					typography: {
						fontWeight: '',
						fontStyle: 'invalid-style',
					},
				},
			},
		} );
		await page
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
		await expect(
			page.getByRole( 'combobox', { name: 'Appearance' } )
		).toHaveText( 'Default' );
	} );
} );
