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

	test( 'gallery caption can be edited', async ( {
		admin,
		editor,
		page,
	} ) => {
		const galleryCaption = 'Tested gallery caption';

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			innerBlocks: [
				{
					name: 'core/image',
					attributes: {
						id: uploadedMedia.id,
						url: uploadedMedia.source_url,
					},
				},
			],
		} );

		const gallery = page.locator( 'role=document[name="Block: Gallery"i]' );
		const caption = gallery.locator(
			'role=textbox[name="Gallery caption text"i]'
		);
		await expect( gallery ).toBeVisible();

		await gallery.click();
		await expect( caption ).toBeVisible();
		await caption.click();

		await page.keyboard.type( galleryCaption );

		await expect
			.poll( editor.getEditedPostContent )
			.toMatch(
				new RegExp( `<figcaption.*?>${ galleryCaption }</figcaption>` )
			);
	} );

	test( "uploaded images' captions can be edited", async ( {
		admin,
		editor,
		page,
	} ) => {
		const caption = 'Tested caption';

		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/gallery',
			innerBlocks: [
				{
					name: 'core/image',
					attributes: {
						id: uploadedMedia.id,
						url: uploadedMedia.source_url,
					},
				},
			],
		} );

		const galleryImage = page.locator(
			'role=document[name="Block: Gallery"i] >> role=document[name="Block: Image"i]'
		);
		const imageCaption = galleryImage.locator(
			'role=textbox[name="Image caption text"i]'
		);
		await expect( galleryImage ).toBeVisible();

		await galleryImage.click();
		await editor.clickBlockToolbarButton( 'Add caption' );

		await expect( imageCaption ).toBeVisible();
		await imageCaption.click();

		await page.keyboard.type( caption );

		await expect
			.poll( editor.getEditedPostContent )
			.toMatch(
				new RegExp( `<figcaption.*?>${ caption }</figcaption>` )
			);
	} );
} );
