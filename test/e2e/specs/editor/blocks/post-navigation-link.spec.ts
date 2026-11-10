import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Post Navigation Link', () => {
	for ( const type of [ 'next', 'previous' ] ) {
		test( `preserves the selected taxonomy and restores Unfiltered after saving and reloading: ${ type }`, async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/post-navigation-link',
				attributes: { type, taxonomy: 'category' },
			} );
			await editor.openDocumentSettingsSidebar();
			const advanced = page.getByRole( 'button', {
				name: 'Advanced',
				exact: true,
			} );
			await advanced.click();

			const taxonomy = page.getByRole( 'combobox', {
				name: 'Filter by taxonomy',
			} );
			await expect( taxonomy ).toHaveText( 'Categories' );
			await expect( taxonomy ).toHaveAccessibleDescription(
				'Only link to posts that have the same taxonomy terms as the current post. For example the same tags or categories.'
			);

			await taxonomy.click();
			await page
				.getByRole( 'option', { name: 'Tags', exact: true } )
				.click();
			await expect( taxonomy ).toHaveText( 'Tags' );
			await editor.saveDraft();
			await page.reload();
			await editor.selectBlocks(
				editor.canvas.locator(
					'[data-type="core/post-navigation-link"]'
				)
			);
			if (
				( await advanced.getAttribute( 'aria-expanded' ) ) === 'false'
			) {
				await advanced.click();
			}
			await expect( taxonomy ).toHaveText( 'Tags' );
			expect( await editor.getBlocks() ).toMatchObject( [
				{ attributes: { type, taxonomy: 'post_tag' } },
			] );

			await taxonomy.press( 'ArrowDown' );
			await expect(
				page.getByRole( 'option', { name: 'Tags', exact: true } )
			).toBeFocused();
			await page.keyboard.press( 'Home' );
			await expect(
				page.getByRole( 'option', { name: 'Unfiltered', exact: true } )
			).toBeFocused();
			await page.keyboard.press( 'Enter' );
			await expect( taxonomy ).toHaveText( 'Unfiltered' );
			await expect( taxonomy ).toBeFocused();
			await editor.saveDraft();
			await page.reload();
			await editor.selectBlocks(
				editor.canvas.locator(
					'[data-type="core/post-navigation-link"]'
				)
			);
			if (
				( await advanced.getAttribute( 'aria-expanded' ) ) === 'false'
			) {
				await advanced.click();
			}
			await expect( taxonomy ).toHaveText( 'Unfiltered' );
			expect( await editor.getBlocks() ).toMatchObject( [
				{ attributes: { type, taxonomy: '' } },
			] );
		} );
	}
} );
