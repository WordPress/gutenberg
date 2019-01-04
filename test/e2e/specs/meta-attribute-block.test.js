/**
 * Internal dependencies
 */
import {
	newPost,
	getEditedPostContent,
	saveDraft,
	insertBlock,
} from '../support/utils';
import { activatePlugin, deactivatePlugin } from '../support/plugins';

describe( 'Block with a meta attribute', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-meta-attribute-block' );
	} );

	beforeEach( async () => {
		await newPost();
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

		const persistedValues = await page.evaluate( () => Array.from( document.querySelectorAll( '.my-meta-input' ) ).map( ( input ) => input.value ) );
		persistedValues.forEach( ( val ) => {
			expect( val ).toBe( 'Meta Value' );
		} );
	} );
} );
