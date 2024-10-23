/**
 * External dependencies
 */
const path = require( 'path' );

/** @typedef {import('@playwright/test').Page} Page */

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Media & Text', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'can be replaced while maintaining image size.', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const primaryImage = await requestUtils.uploadMedia(
			path.join(
				'./test/e2e/assets',
				'1024x768_e2e_test_image_size.jpeg'
			)
		);

		await editor.insertBlock( {
			name: 'core/media-text',
		} );

		const mediaAndTextBlock = editor.canvas.locator(
			'role=document[name="Block: Media & Text"i]'
		);
		await expect( mediaAndTextBlock ).toBeVisible();
		await editor.canvas
			.locator( 'role=button[name="Media Library"i]' )
			.click();
		const mediaLibrary = page.locator(
			'role=dialog[name="Select or Upload Media"i]'
		);
		await expect( mediaLibrary ).toBeVisible();
		await page.locator( `role=checkbox[checked=false]` ).click();
		await page.locator( 'role=button[name="Select"i]' ).click();
		await page
			.locator( `role=combobox[name="Resolution"i]` )
			.selectOption( 'Medium' );

		expect( await editor.getEditedPostContent() )
			.toMatch( `<!-- wp:media-text {"mediaId":${ primaryImage.id },"mediaLink":"${ primaryImage.link }","mediaType":"image","mediaSizeSlug":"medium"} -->
<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="${ primaryImage.media_details.sizes.medium.source_url }" alt="" class="wp-image-${ primaryImage.id } size-medium"/></figure><div class="wp-block-media-text__content"><!-- wp:paragraph {"placeholder":"Content…"} -->
<p></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->` );

		const secondaryImage = await requestUtils.uploadMedia(
			path.join(
				'./test/e2e/assets',
				'1024x768_e2e_test_image_size.jpeg'
			)
		);

		await editor.clickBlockToolbarButton( 'Replace' );
		await page
			.locator( 'role=menuitem[name="Open Media Library"i]' )
			.click();

		await page.locator( `role=checkbox[checked=false]` ).click();
		await page.locator( 'role=button[name="Select"i]' ).click();
		expect( await editor.getEditedPostContent() )
			.toMatch( `<!-- wp:media-text {"mediaId":${ secondaryImage.id },"mediaLink":"${ secondaryImage.link }","mediaType":"image","mediaSizeSlug":"medium"} -->
<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="${ secondaryImage.media_details.sizes.medium.source_url }" alt="" class="wp-image-${ secondaryImage.id } size-medium"/></figure><div class="wp-block-media-text__content"><!-- wp:paragraph {"placeholder":"Content…"} -->
<p></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->` );
	} );

	test( `Should fall back to full if an image of the same size does not exist.`, async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const primaryImage = await requestUtils.uploadMedia(
			path.join(
				'./test/e2e/assets',
				'1024x768_e2e_test_image_size.jpeg'
			)
		);

		await editor.insertBlock( {
			name: 'core/media-text',
		} );

		const mediaAndTextBlock = editor.canvas.locator(
			'role=document[name="Block: Media & Text"i]'
		);
		await expect( mediaAndTextBlock ).toBeVisible();
		await editor.canvas
			.locator( 'role=button[name="Media Library"i]' )
			.click();
		const mediaLibrary = page.locator(
			'role=dialog[name="Select or Upload Media"i]'
		);
		await expect( mediaLibrary ).toBeVisible();
		await page.locator( `role=checkbox[checked=false]` ).click();
		await page.locator( 'role=button[name="Select"i]' ).click();
		await page
			.locator( `role=combobox[name="Resolution"i]` )
			.selectOption( 'Medium' );

		expect( await editor.getEditedPostContent() )
			.toMatch( `<!-- wp:media-text {"mediaId":${ primaryImage.id },"mediaLink":"${ primaryImage.link }","mediaType":"image","mediaSizeSlug":"medium"} -->
<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="${ primaryImage.media_details.sizes.medium.source_url }" alt="" class="wp-image-${ primaryImage.id } size-medium"/></figure><div class="wp-block-media-text__content"><!-- wp:paragraph {"placeholder":"Content…"} -->
<p></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->` );

		const secondaryImage = await requestUtils.uploadMedia(
			path.join( './test/e2e/assets', '10x10_e2e_test_image_z9T8jK.png' )
		);

		await editor.clickBlockToolbarButton( 'Replace' );
		await page
			.locator( 'role=menuitem[name="Open Media Library"i]' )
			.click();

		await page.locator( `role=checkbox[checked=false]` ).click();
		await page.locator( 'role=button[name="Select"i]' ).click();
		expect( await editor.getEditedPostContent() )
			.toMatch( `<!-- wp:media-text {"mediaId":${ secondaryImage.id },"mediaLink":"${ secondaryImage.link }","mediaType":"image","mediaSizeSlug":"full"} -->
<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="${ secondaryImage.source_url }" alt="" class="wp-image-${ secondaryImage.id } size-full"/></figure><div class="wp-block-media-text__content"><!-- wp:paragraph {"placeholder":"Content…"} -->
<p></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->` );
	} );
} );
