/**
 * External dependencies
 */
const path = require( 'path' );
/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Registered sources', () => {
	// let imagePlaceholderSrc;
	// let imageCustomFieldSrc;
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme(
			'gutenberg-test-themes/block-bindings'
		);
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
		// await requestUtils.deleteAllMedia();
		// const placeholderMedia = await requestUtils.uploadMedia(
		// 	path.join( './test/e2e/assets', '10x10_e2e_test_image_z9T8jK.png' )
		// );
		// imagePlaceholderSrc = placeholderMedia.source_url;
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( { title: 'Test bindings' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.describe( 'getValues', () => {
		test( 'should show the returned value in paragraph content', async () => {} );
		test( 'should show the returned value in heading content', async () => {} );
		test( 'should show the returned values in button attributes', async () => {} );
		test( 'should show the returned values in image attributes', async () => {} );
		test( 'should fall back to source label when `getValues` is undefined', async () => {} );
		test( 'should fall back to null when `getValues` is undefined in URL attributes', async () => {} );
	} );

	test.describe( 'canUserEditValue returns false', () => {
		test( 'should lock paragraph editing', async () => {} );
		test( 'should lock heading editing', async () => {} );
		test( 'should lock button editing and controls', async () => {} );
		test( 'should lock image editing and controls', async () => {} );
	} );

	test.describe( 'canUserEditValue not defined', () => {
		test( 'should lock paragraph editing', async () => {} );
		test( 'should lock heading editing', async () => {} );
		test( 'should lock button editing and controls', async () => {} );
		test( 'should lock image editing and controls', async () => {} );
	} );

	test.describe( 'setValues is not defined', () => {
		test( 'should lock paragraph editing', async () => {} );
		test( 'should lock heading editing', async () => {} );
		test( 'should lock button editing and controls', async () => {} );
		test( 'should lock image editing and controls', async () => {} );
	} );

	test.describe( 'setValues', () => {
		test( 'should be possible to edit the value from paragraph content', async () => {} );
		// Related issue: https://github.com/WordPress/gutenberg/issues/62347
		test( 'should be possible to use symbols and numbers as the custom field value', async () => {} );
		test( 'should be possible to edit the value from heading content', async () => {} );
		test( 'should be possible to edit the values from button attributes', async () => {} );
		test( 'should be possible to edit the values from image attributes', async () => {} );
	} );

	test.describe( 'getFieldsList', () => {
		test( 'should show all the available fields in the dropdown UI', async () => {} );
		test( 'should show the connected values in the attributes panel', async () => {} );
		test( 'should be possible to connect the paragraph content', async () => {} );
		test( 'should be possible to connect the heading content', async () => {} );
		test( 'should be possible to connect the button supported attributes', async () => {
			// Check the not supported ones are not included.
		} );
		test( 'should be possible to connect the image supported attributes', async () => {
			// Check the not supported ones are not included.
		} );
	} );

	test.describe( 'RichText workflows', () => {
		test( 'should add empty paragraph block when pressing enter in paragraph', async () => {} );
		test( 'should add empty paragraph block when pressing enter in heading', async () => {} );
		test( 'should add empty button block when pressing enter in button', async () => {} );
		test( 'should show placeholder prompt when value is empty and can edit', async () => {} );
		test( 'should show `getFieldsList` label or the source label when value is empty and cannot edit', async () => {} );
		test( 'should show placeholder attribute over bindings placeholder', async () => {} );
	} );

	test( 'should show the label of a source only registered in the server in blocks connected', async () => {} );
	test( 'should lock editing when connected to an undefined source', async () => {} );
	test( 'should show an "Invalid source" warning for not registered sources', async () => {} );
} );
