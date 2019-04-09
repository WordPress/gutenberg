/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'undo', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should undo typing after a pause', async () => {
		await clickBlockAppender();

		await page.keyboard.type( 'before pause' );
		await new Promise( ( resolve ) => setTimeout( resolve, 1000 ) );
		await page.keyboard.type( ' after pause' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should undo typing after non input change', async () => {
		await clickBlockAppender();

		await page.keyboard.type( 'before keyboard ' );
		await pressKeyWithModifier( 'primary', 'b' );
		await page.keyboard.type( 'after keyboard' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'z' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'Should undo to expected level intervals', async () => {
		await clickBlockAppender();

		await page.keyboard.type( 'This' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'is' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'test' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressKeyWithModifier( 'primary', 'z' ); // Undo 3rd paragraph text.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 3rd block.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 2nd paragraph text.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 2nd block.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 1st paragraph text.
		await pressKeyWithModifier( 'primary', 'z' ); // Undo 1st block.

		expect( await getEditedPostContent() ).toBe( '' );
		// After undoing every action, there should be no more undo history.
		expect( await page.$( '.editor-history__undo[aria-disabled="true"]' ) ).not.toBeNull();
	} );
} );
