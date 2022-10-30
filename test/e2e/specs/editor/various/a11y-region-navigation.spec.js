/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Region navigation (@firefox, @webkit)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'navigates forward and back again', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		// Navigate to first region and check that we made it.
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );
		const editorTopBar = page.locator(
			'role=region[name="Editor top bar"i]'
		);
		await expect( editorTopBar ).toBeFocused();

		// Navigate to next/second region and check that we made it.
		await pageUtils.pressKeyWithModifier( 'ctrl', '`' );
		const editorContent = page.locator(
			'role=region[name="Editor content"i]'
		);
		await expect( editorContent ).toBeFocused();

		// Navigate to previous/first region and check that we made it.
		await pageUtils.pressKeyWithModifier( 'ctrlShift', '`' );
		await expect( editorTopBar ).toBeFocused();
	} );
} );
