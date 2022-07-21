/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const urlButtonSelector = '*[aria-label^="Change URL"]';

// This tests are not together with the remaining sidebar tests,
// because we need to publish/save a post, to correctly test the permalink row.
// The sidebar test suit enforces that focus is never lost, but during save operations
// the focus is lost and a new element is focused once the save is completed.
test.describe( 'Sidebar Permalink', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-custom-post-types'
		);
	} );

	test( 'should not render URL when post is publicly queryable but not public', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'public_q_not_public' } );
		await page.keyboard.type( 'aaaaa' );
		await editor.publishPost();
		// Start editing again.
		await page.type( '.editor-post-title__input', ' (Updated)' );
		expect( page.locator( urlButtonSelector ) ).toBeNull();
	} );

	test( 'should not render URL when post is public but not publicly queryable', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'not_public_q_public' } );
		await page.keyboard.type( 'aaaaa' );
		await editor.publishPost();
		// Start editing again.
		await page.type( '.editor-post-title__input', ' (Updated)' );
		expect( page.locator( urlButtonSelector ) ).toBeNull();
	} );

	test( 'should render URL when post is public and publicly queryable', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'public_q_public' } );
		await page.keyboard.type( 'aaaaa' );
		await editor.publishPost();
		// Start editing again.
		await page.type( '.editor-post-title__input', ' (Updated)' );
		expect( page.locator( urlButtonSelector ) ).not.toBeNull();
	} );
} );
