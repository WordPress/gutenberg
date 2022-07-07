/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Gallery', () => {
	let uploadedMedia;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();

		uploadedMedia = await requestUtils.uploadMedia(
			path.resolve(
				process.cwd(),
				'test/e2e/assets/10x10_e2e_test_image_z9T8jK.png'
			)
		);
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'can be transformed from pasting shortcode, and can undo/redo', async ( {
		admin,
		editor,
		page,
		pageUtils,
	} ) => {
		await admin.createNewPost();

		await pageUtils.setClipboardData( {
			plainText: `[gallery ids="${ uploadedMedia.id }"]`,
		} );

		await page.click( 'role=button[name="Add default block"i]' );
		await pageUtils.pressKeyWithModifier( 'primary', 'v' );

		const img = page.locator(
			'role=document[name="Block: Image"i] >> role=img'
		);

		await expect( img ).toHaveAttribute( 'src', uploadedMedia.source_url );
		await expect( img ).toBeVisible();

		const editedPostContent = await editor.getEditedPostContent();
		expect( editedPostContent )
			.toBe( `<!-- wp:gallery {"columns":3,"linkTo":"none"} -->
<figure class="wp-block-gallery has-nested-images columns-3 is-cropped"><!-- wp:image {"id":${ uploadedMedia.id },"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="${ uploadedMedia.source_url }" alt="${ uploadedMedia.alt_text }" class="wp-image-${ uploadedMedia.id }"/></figure>
<!-- /wp:image --></figure>
<!-- /wp:gallery -->` );

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Undo"i]'
		);

		await expect.poll( editor.getEditedPostContent ).toBe( '' );

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Redo"i]'
		);

		await expect
			.poll( editor.getEditedPostContent )
			.toBe( editedPostContent );
	} );
} );
