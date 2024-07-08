/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Font Appearance Control dropdown menu', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentythree' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
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
			page.getByRole( 'button', { name: 'Appearance' } )
		).toContainText( 'Regular' );

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
			page.getByRole( 'button', { name: 'Appearance' } )
		).toContainText( 'Extra Light Italic' );

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
			page.getByRole( 'button', { name: 'Appearance' } )
		).toContainText( 'Bold Italic' );
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
					typography: { fontWeight: '', fontStyle: '' },
				},
			},
		} );
		await page
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Appearance' } )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Appearance' } )
		).toContainText( 'Default' );
	} );
} );
