/**
 * WordPress dependencies
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Using Hooks API', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-hooks-api' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-hooks-api' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'Should contain a reset block button on the sidebar', async ( {
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'First paragraph' );
		expect(
			page.locator( '.edit-post-sidebar .e2e-reset-block-button' )
		).not.toBeNull();
	} );

	test( 'Pressing reset block button resets the block', async ( {
		editor,
		page,
	} ) => {
		await page.click( 'role=button[name="Add default block"i]' );
		await page.keyboard.type( 'First paragraph' );

		const content = page.locator( 'p[data-type="core/paragraph"]' );
		expect( await content.evaluate( ( node ) => node.innerText ) ).toEqual(
			'First paragraph'
		);
		await page.click( 'role=button[name="Reset Block"i]' );
		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );
} );
