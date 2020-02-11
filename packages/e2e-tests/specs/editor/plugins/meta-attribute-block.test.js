/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	getEditedPostContent,
	insertBlock,
	saveDraft,
	pressKeyTimes,
} from '@wordpress/e2e-test-utils';

describe( 'Block with a meta attribute', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-meta-attribute-block' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-meta-attribute-block' );
	} );

	it( 'Should persist the meta attribute properly', async () => {
		await insertBlock( 'Test Meta Attribute Block' );
		await page.keyboard.type( 'Value' );

		// Regression Test: Previously the caret would wrongly reset to the end
		// of any input for meta-sourced attributes, due to syncing behavior of
		// meta attribute updates.
		//
		// See: https://github.com/WordPress/gutenberg/issues/15739
		await pressKeyTimes( 'ArrowLeft', 5 );
		await page.keyboard.type( 'Meta ' );

		await saveDraft();
		await page.reload();

		expect( await getEditedPostContent() ).toMatchSnapshot();
		const persistedValue = await page.evaluate(
			() => document.querySelector( '.my-meta-input' ).value
		);
		expect( persistedValue ).toBe( 'Meta Value' );
	} );

	it( 'Should use the same value in all the blocks', async () => {
		await insertBlock( 'Test Meta Attribute Block' );
		await insertBlock( 'Test Meta Attribute Block' );
		await insertBlock( 'Test Meta Attribute Block' );
		await page.keyboard.type( 'Meta Value' );

		const inputs = await page.$$( '.my-meta-input' );
		await Promise.all(
			inputs.map( async ( input ) => {
				// Clicking the input selects the block,
				// and selecting the block enables the sync data mode
				// as otherwise the asynchronous re-rendering of unselected blocks
				// may cause the input to have not yet been updated for the other blocks
				await input.click();
				const inputValue = await input.getProperty( 'value' );
				expect( await inputValue.jsonValue() ).toBe( 'Meta Value' );
			} )
		);
	} );

	it( 'Should persist the meta attribute properly in a different post type', async () => {
		await createNewPost( { postType: 'page' } );
		await insertBlock( 'Test Meta Attribute Block' );
		await page.keyboard.type( 'Value' );

		// Regression Test: Previously the caret would wrongly reset to the end
		// of any input for meta-sourced attributes, due to syncing behavior of
		// meta attribute updates.
		//
		// See: https://github.com/WordPress/gutenberg/issues/15739
		await pressKeyTimes( 'ArrowLeft', 5 );
		await page.keyboard.type( 'Meta ' );

		await saveDraft();
		await page.reload();

		expect( await getEditedPostContent() ).toMatchSnapshot();
		const persistedValue = await page.evaluate(
			() => document.querySelector( '.my-meta-input' ).value
		);
		expect( persistedValue ).toBe( 'Meta Value' );
	} );
} );
