/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// This spec tests common behavior of Verse, Code, and Preformatted blocks.
[ 'core/verse', 'core/code', 'core/preformatted' ].forEach( ( blockName ) => {
	test.describe( blockName, () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost();
		} );

		test( 'should exit on triple Enter and merge back', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: blockName } );
			await page.keyboard.type( 'a' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'b' );

			expect( await editor.getBlocks() ).toMatchObject( [
				{
					name: blockName,
					attributes: {
						content: 'a',
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						content: 'b',
					},
				},
			] );

			await page.keyboard.press( 'ArrowLeft' );
			await page.keyboard.press( 'Backspace' );

			expect( await editor.getBlocks() ).toMatchObject( [
				{
					name: blockName,
					attributes: {
						content: 'a<br><br>b',
					},
				},
			] );
		} );
	} );
} );
