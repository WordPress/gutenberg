/**
 * Internal dependencies
 */
import {
	newPost,
	pressWithModifier,
	getEditedPostContent,
} from '../support/utils';

describe( 'undo', () => {
	beforeAll( async () => {
		await newPost();
	} );

	it( 'Should undo to expected level intervals', async () => {
		await page.click( '.editor-default-block-appender__content' );

		await page.keyboard.type( 'This' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'is' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'test' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await pressWithModifier( 'mod', 'z' ); // Strip 3rd paragraph text
		await pressWithModifier( 'mod', 'z' ); // Strip 3rd paragraph block
		await pressWithModifier( 'mod', 'z' ); // Strip 2nd paragraph text
		await pressWithModifier( 'mod', 'z' ); // Strip 2nd paragraph block
		await pressWithModifier( 'mod', 'z' ); // Strip 1st paragraph text
		await pressWithModifier( 'mod', 'z' ); // Strip 1st paragraph block

		// Should have no more history.
		await page.waitForSelector( '.editor-history__undo:disabled' );

		expect( await getEditedPostContent() ).toBe( '' );
	} );
} );
