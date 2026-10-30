const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// The default e2e theme has no theme.json, so the classic layout styles are
// expected in the canvas too.
const CONTENT_STYLE_IDS = [
	'wp-reset-editor-styles-css',
	'wp-block-editor-content-css',
	'wp-editor-classic-layout-styles-css',
];

test.describe( 'Canvas content styles', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should load content styles only inside the post editor canvas', async ( {
		editor,
		page,
	} ) => {
		for ( const id of CONTENT_STYLE_IDS ) {
			await expect( editor.canvas.locator( `#${ id }` ) ).toBeAttached();
			await expect( page.locator( `#${ id }` ) ).toHaveCount( 0 );
		}

		// Block editor styles also target the UI outside the canvas.
		await expect(
			page.locator( '#wp-block-library-editor-css' )
		).toBeAttached();
	} );
} );
