/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const VARIATIONS = [
	[ 'Early Registration', 'test/test-meta-attribute-block-early' ],
	[ 'Late Registration', 'test/test-meta-attribute-block-late' ],
];

test.describe( 'Block with a meta attribute', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-meta-attribute-block'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-meta-attribute-block'
		);
	} );

	for ( const [ title, blockName ] of VARIATIONS ) {
		test.describe( title, () => {
			test( 'Should persist the meta attribute properly', async ( {
				admin,
				editor,
				page,
				pageUtils,
			} ) => {
				await admin.createNewPost();
				await editor.insertBlock( { name: blockName } );
				await page.keyboard.type( 'Value' );

				// Regression Test: Previously the caret would wrongly reset to the end
				// of any input for meta-sourced attributes, due to syncing behavior of
				// meta attribute updates.
				//
				// See: https://github.com/WordPress/gutenberg/issues/15739
				await pageUtils.pressKeys( 'ArrowLeft', { times: 5 } );
				await page.keyboard.type( 'Meta ' );

				await editor.saveDraft();
				await page.reload();

				const block = page.getByRole( 'document', {
					name: `Block: Test Meta Attribute Block (${ title })`,
				} );
				await expect( block ).toBeVisible();
				await expect( block.locator( '.my-meta-input' ) ).toHaveValue(
					'Meta Value'
				);
			} );

			test( 'Should use the same value in all the blocks', async ( {
				admin,
				editor,
				page,
			} ) => {
				await admin.createNewPost();
				await editor.insertBlock( { name: blockName } );
				await editor.insertBlock( { name: blockName } );
				await editor.insertBlock( { name: blockName } );
				await page.keyboard.type( 'Meta Value' );

				const inputs = await page.locator( '.my-meta-input' ).all();
				for ( const input of inputs ) {
					await expect( input ).toHaveValue( 'Meta Value' );
				}
			} );

			test( 'Should persist the meta attribute properly in a different post type', async ( {
				admin,
				editor,
				page,
				pageUtils,
			} ) => {
				await admin.createNewPost( { postType: 'page' } );
				await editor.insertBlock( { name: blockName } );
				await page.keyboard.type( 'Value' );

				// Regression Test: Previously the caret would wrongly reset to the end
				// of any input for meta-sourced attributes, due to syncing behavior of
				// meta attribute updates.
				//
				// See: https://github.com/WordPress/gutenberg/issues/15739
				await pageUtils.pressKeys( 'ArrowLeft', { times: 5 } );
				await page.keyboard.type( 'Meta ' );

				await editor.saveDraft();
				await page.reload();

				const block = page.getByRole( 'document', {
					name: `Block: Test Meta Attribute Block (${ title })`,
				} );
				await expect( block ).toBeVisible();
				await expect( block.locator( '.my-meta-input' ) ).toHaveValue(
					'Meta Value'
				);
			} );
		} );
	}
} );
