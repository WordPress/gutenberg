/**
 * External dependencies
 */
const path = require( 'path' );
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post Meta source', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme(
			'gutenberg-test-themes/block-bindings'
		);
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.describe( 'Movie CPT template', () => {
		test.beforeEach( async ( { admin, editor } ) => {
			await admin.visitSiteEditor( {
				postId: 'gutenberg-test-themes/block-bindings//single-movie',
				postType: 'wp_template',
				canvas: 'edit',
			} );
			await editor.openDocumentSettingsSidebar();
		} );

		test.describe( 'Block attribues', () => {
			test( 'should not be possible to edit connected blocks', async () => {} );
			test( 'should show the default value if it is defined', async () => {} );
			test( 'should fall back to the field label if the default value is not defined', async () => {} );
			test( 'should fall back to the field key if the field label is not defined', async () => {} );
		} );

		test.describe( 'Attribues panel', () => {
			test( 'should show the default value if it is defined', async () => {} );
			test( 'should fall back to the field label if the default value is not defined', async () => {} );
			test( 'should fall back to the field key if the field label is not defined', async () => {} );
		} );

		test.describe( 'Fields list dropdown', () => {
			test( 'should show the default value if it is defined', async () => {} );
			test( 'should not show anything if the default value is not defined', async () => {} );
			test( 'should include movie fields in UI to connect attributes', async () => {} );
			test( 'should include global fields in UI to connect attributes', async () => {} );
			test( 'should not include protected fields', async () => {} );
		} );
	} );

	test.describe( 'Custom template', () => {
		test.beforeEach( async ( { admin, editor } ) => {
			await admin.visitSiteEditor( {
				postId: 'gutenberg-test-themes/block-bindings//single-movie',
				postType: 'wp_template',
				canvas: 'edit',
			} );
			await editor.openDocumentSettingsSidebar();
		} );

		test( 'should not include post meta fields in UI to connect attributes', async () => {} );
		test( 'should show the key in attributes connected to post meta', async () => {} );
	} );

	test.describe( 'Movie CPT post', () => {
		test.beforeEach( async ( { admin } ) => {
			// CHECK HOW TO CREATE A MOVIE.
			await admin.createNewPost( { title: 'Test bindings' } );
		} );

		test( 'should show the custom field value of that specific post', async () => {} );
		test( 'should fall back to the key when custom field is not accessible', async () => {} );
		test( 'should not show or edit the value of a protected field', async () => {} );
		test( 'should not show or edit the value of a field with `show_in_rest` set to false', async () => {} );
		test( 'should be possible to edit the value of the connected custom fields', async () => {} );
		test( 'should be possible to connect movie fields through the attributes panel', async () => {} );
	} );
} );
