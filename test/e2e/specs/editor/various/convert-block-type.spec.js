/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Code block', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should convert to a preformatted block', async ( {
		page,
		editor,
	} ) => {
		const code = 'print "Hello Dolly!"';

		await editor.insertBlock( { name: 'core/code' } );
		await page.keyboard.type( code );

		// Verify the content starts out as a Code block.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await editor.transformBlockTo( 'core/preformatted' );

		// The content should now be a Preformatted block with no data loss.
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
