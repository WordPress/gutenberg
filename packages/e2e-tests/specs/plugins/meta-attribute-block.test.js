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
		await page.keyboard.type( 'Meta Value' );
		await saveDraft();
		await page.reload();

		expect( await getEditedPostContent() ).toMatchSnapshot();
		const persistedValue = await page.evaluate( () => document.querySelector( '.my-meta-input' ).value );
		expect( persistedValue ).toBe( 'Meta Value' );
	} );

	it( 'Should use the same value in all the blocks', async () => {
		await insertBlock( 'Test Meta Attribute Block' );
		await insertBlock( 'Test Meta Attribute Block' );
		await insertBlock( 'Test Meta Attribute Block' );
		await page.keyboard.type( 'Meta Value' );

		const inputs = await page.$$( '.my-meta-input' );
		await inputs.forEach( async ( input ) => {
			// Clicking the input selects the block,
			// and selecting the block enables the sync data mode
			// as otherwise the asynchronous rerendering of unselected blocks
			// may cause the input to have not yet been updated for the other blocks
			await input.click();
			expect( await input.getProperty( 'value' ) ).toBe( 'Meta Value' );
		} );
	} );
} );
