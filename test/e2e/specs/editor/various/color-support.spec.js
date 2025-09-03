/**
 * WordPress dependencies
 */
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Link color in themes', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should apply selected link color in editor and frontend', async ( {
		page,
		editor,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content:
					'This paragraph will have a <a href="https://example.com">custom link color set</a>',
			},
		} );

		await editor.openDocumentSettingsSidebar();

		await page.getByRole( 'button', { name: 'Color options' } ).click();

		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Link' } )
			.click();

		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Link', exact: true } )
			.click();

		await page
			.getByRole( 'button', { name: 'Custom color picker' } )
			.click();
		await page
			.getByRole( 'textbox', { name: 'Hex color' } )
			.fill( 'ff0000' );

		await page.getByRole( 'button', { name: 'Close Settings' } ).click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					style: {
						elements: {
							link: {
								color: {
									text: '#ff0000',
								},
							},
						},
					},
				},
			},
		] );
		const previewPage = await editor.openPreviewPage();

		const previewContent = previewPage.getByRole( 'link', {
			name: 'custom link color set',
		} );
		await expect( previewContent ).toBeVisible();

		/**
		 * Test: Check if the link color is set in the frontend.
		 * #ff0000 is rgb(255, 0, 0).
		 */
		await expect( previewContent ).toHaveCSS( 'color', 'rgb(255, 0, 0)' );
	} );
} );
