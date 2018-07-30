/**
 * Internal dependencies
 */
import {
	newPost,
	pressWithModifier,
	getEditedPostContent,
} from '../support/utils';

describe.skip( 'undo', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'Should undo to expected level intervals', async () => {
		await page.click( '.editor-default-block-appender' );

		await page.keyboard.type( 'This' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'is' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'test' );

		await pressWithModifier( 'mod', 'z' ); // Strip 3rd paragraph text
		await pressWithModifier( 'mod', 'z' ); // Strip 3rd paragraph block
		await pressWithModifier( 'mod', 'z' ); // Strip 2nd paragraph text
		await pressWithModifier( 'mod', 'z' ); // Strip 2nd paragraph block
		await pressWithModifier( 'mod', 'z' ); // Strip 1st paragraph text
		await pressWithModifier( 'mod', 'z' ); // Strip 1st paragraph block

		expect( await getEditedPostContent() ).toBe( '' );

		// Should have no more history.
		const undoButton = await page.$( '.editor-history__undo:not( :disabled )' );
		expect( undoButton ).toBeNull();
	} );
} );
