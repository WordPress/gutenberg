/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	newPost,
	pressWithModifier,
} from '../support/utils';

describe( 'undo', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'Should undo to expected level intervals', async () => {
		await clickBlockAppender();

		await page.keyboard.type( 'This' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'is' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'test' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressWithModifier( 'primary', 'z' ); // Undo 3rd paragraph text.
		await pressWithModifier( 'primary', 'z' ); // Undo 3rd block.
		await pressWithModifier( 'primary', 'z' ); // Undo 2nd paragraph text.
		await pressWithModifier( 'primary', 'z' ); // Undo 2nd block.
		await pressWithModifier( 'primary', 'z' ); // Undo 1st paragraph text.
		await pressWithModifier( 'primary', 'z' ); // Undo 1st block.

		expect( await getEditedPostContent() ).toBe( '' );
		// After undoing every action, there should be no more undo history.
		expect( await page.$( '.editor-history__undo[aria-disabled="true"]' ) ).not.toBeNull();
	} );
} );
