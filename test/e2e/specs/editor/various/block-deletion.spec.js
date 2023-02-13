/**
 * WordPress dependencies
 */
const { test } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Block deletion', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'deleting last block via the Remove Block menu item', () => {} );

	test( 'deleting last block via the Remove Block shortcut', () => {} );

	test( 'deleting last block via backspace from an empty paragraph', () => {} );

	test( 'deleting last selected block via backspace', () => {} );

	test( 'deleting last two selected blocks via backspace', () => {} );

	test( 'deleting all blocks', () => {} );

	test( 'deleting all blocks when the default block is unavailable', () => {} );
} );
