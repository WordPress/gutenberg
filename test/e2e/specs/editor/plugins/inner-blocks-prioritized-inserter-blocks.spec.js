/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Prioritized Inserter Blocks Setting on InnerBlocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-innerblocks-prioritized-inserter-blocks'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-innerblocks-prioritized-inserter-blocks'
		);
	} );

	test.describe( 'Quick Inserter', () => {
		test( 'uses defaulting ordering if prioritzed blocks setting was not set', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'test/prioritized-inserter-blocks-unset',
			} );

			const block = page.getByRole( 'document', {
				name: 'Block: Prioritized Inserter Blocks Unset',
			} );

			await block
				.getByRole( 'button', {
					name: 'Add block',
				} )
				.click();

			const blockListBox = page.getByRole( 'listbox', {
				name: 'Blocks',
			} );
			await expect( blockListBox ).toBeVisible();
			await expect( blockListBox.getByRole( 'option' ) ).toHaveCount( 6 );
		} );

		test( 'uses the priority ordering if prioritzed blocks setting is set', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'test/prioritized-inserter-blocks-set',
			} );

			const block = page.getByRole( 'document', {
				name: 'Block: Prioritized Inserter Blocks Set',
			} );

			await block
				.getByRole( 'button', {
					name: 'Add block',
				} )
				.click();

			const blockListBox = page.getByRole( 'listbox', {
				name: 'Blocks',
			} );
			await expect( blockListBox ).toBeVisible();

			// Should still be only 6 results regardless of the priority ordering.
			await expect( blockListBox.getByRole( 'option' ) ).toHaveCount( 6 );
			await expect( blockListBox.getByRole( 'option' ) ).toContainText( [
				'Audio',
				'Spacer',
				'Code',
			] );
		} );

		test( 'obeys allowed blocks over prioritzed blocks setting if conflicted', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'test/prioritized-inserter-blocks-set-with-conflicting-allowed-blocks',
			} );

			const block = page.getByRole( 'document', {
				name: 'Prioritized Inserter Blocks Set With Conflicting Allowed Blocks',
			} );

			await block
				.getByRole( 'button', {
					name: 'Add block',
				} )
				.click();

			const blockListBox = page.getByRole( 'listbox', {
				name: 'Blocks',
			} );
			await expect( blockListBox ).toBeVisible();

			await expect( blockListBox.getByRole( 'option' ) ).toContainText( [
				'Spacer',
				'Code',
				'Paragraph',
			] );
			await expect(
				blockListBox.getByRole( 'option' )
			).not.toContainText( [ 'Audio' ] );
		} );
	} );

	test.describe( 'Slash inserter', () => {
		test( 'uses the priority ordering if prioritzed blocks setting is set', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'test/prioritized-inserter-blocks-set',
			} );

			const imageBlock = page
				.getByRole( 'document', {
					name: 'Block: Prioritized Inserter Blocks Set',
				} )
				.getByRole( 'document', { name: 'Block: Image' } );

			await imageBlock.click();
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( '/' );

			const blockAutocompleter = page.getByRole( 'listbox' );
			await expect( blockAutocompleter ).toBeVisible();

			// Default suggested blocks number.
			await expect(
				blockAutocompleter.getByRole( 'option' )
			).toHaveCount( 9 );
			await expect(
				blockAutocompleter.getByRole( 'option' )
			).toContainText( [ 'Audio', 'Spacer', 'Code' ] );
		} );
	} );
} );
