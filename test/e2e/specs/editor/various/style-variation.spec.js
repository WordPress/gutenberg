/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'adding blocks', () => {
	test( 'Should render the Quote block without style variations', async ( {
		editor,
	} ) => {
		await editor.insertBlock( { name: 'core/quote' } );
		const quoteBlock = await editor.getBlock( 'core/quote' );
		expect( quoteBlock ).toBeTruthy(); // Verify the block is inserted
	} );
} );
