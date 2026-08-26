const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const IMAGE_SRC =
	'data:image/jpeg;base64,/9j/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';

// Markup as saved before the aspect ratio support, without the flag or the
// `is-aspect-ratio-aware` class.
const LEGACY_BLOCK = `<!-- wp:media-text {"mediaType":"image"} -->
<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="${ IMAGE_SRC }" alt="legacy"/></figure><div class="wp-block-media-text__content"><!-- wp:paragraph -->
<p>Legacy</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->`;

// Markup as saved by the current version.
const CURRENT_BLOCK = `<!-- wp:media-text {"mediaType":"image"} -->
<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media is-aspect-ratio-aware"><img src="${ IMAGE_SRC }" alt="current"/></figure><div class="wp-block-media-text__content"><!-- wp:paragraph -->
<p>Current</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->`;

async function computedStyles( page, alt ) {
	return page.locator( `img[alt="${ alt }"]` ).evaluate( ( img ) => {
		const styles = window.getComputedStyle( img );
		const rect = img.getBoundingClientRect();
		return {
			objectFit: styles.objectFit,
			aspectRatio: styles.aspectRatio,
			boxRatio: rect.width / rect.height,
		};
	} );
}

test.describe( 'Media & Text aspect ratio', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.resetThemeGlobalStyles();
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.describe( 'saved markup', () => {
		test( 'leaves legacy blocks untouched when the post is re-saved', async ( {
			admin,
			editor,
		} ) => {
			await admin.createNewPost();
			await editor.setContent( LEGACY_BLOCK );

			const content = await editor.getEditedPostContent();

			// The deprecation matched, so the media wrapper keeps its original
			// class and the media keeps the default `object-fit`.
			expect( content ).toContain(
				'<figure class="wp-block-media-text__media">'
			);
			expect( content ).not.toContain( 'is-aspect-ratio-aware' );
			// The only difference is the flag recorded in the block comment.
			expect( content ).toContain( '"isAspectRatioAware":false' );
		} );

		test( 'marks newly inserted blocks as aspect ratio aware', async ( {
			admin,
			editor,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/media-text',
				attributes: { mediaType: 'image', mediaUrl: IMAGE_SRC },
			} );

			const content = await editor.getEditedPostContent();

			expect( content ).toContain(
				'<figure class="wp-block-media-text__media is-aspect-ratio-aware">'
			);
			// Equal to the default, so it is not written to the block comment.
			expect( content ).not.toContain( 'isAspectRatioAware' );
		} );

		test( 'marks a legacy block aware once it is given an aspect ratio', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.createNewPost();
			await editor.setContent( LEGACY_BLOCK );

			await page.evaluate( () => {
				const { select, dispatch } = window.wp.data;
				const [ block ] = select( 'core/block-editor' ).getBlocks();
				dispatch( 'core/block-editor' ).updateBlockAttributes(
					block.clientId,
					{ style: { dimensions: { aspectRatio: '16/9' } } }
				);
			} );

			const content = await editor.getEditedPostContent();

			// The ratio must never be applied without the paired object-fit.
			expect( content ).toContain( 'aspect-ratio:16/9' );
			expect( content ).toContain( 'is-aspect-ratio-aware' );
		} );

		test( 'pairs the class with an aspect ratio set on the block', async ( {
			admin,
			editor,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/media-text',
				attributes: {
					mediaType: 'image',
					mediaUrl: IMAGE_SRC,
					style: { dimensions: { aspectRatio: '16/9' } },
				},
			} );

			const content = await editor.getEditedPostContent();

			expect( content ).toContain( 'is-aspect-ratio-aware' );
			expect( content ).toContain( 'aspect-ratio:16/9' );
		} );
	} );

	test.describe( 'front end', () => {
		test( 'crops media when the ratio is set on the block', async ( {
			page,
			requestUtils,
		} ) => {
			const post = await requestUtils.createPost( {
				title: 'Aspect ratio on the block',
				content: `${ LEGACY_BLOCK }\n\n<!-- wp:media-text {"mediaType":"image","style":{"dimensions":{"aspectRatio":"16/9"}}} -->
<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media is-aspect-ratio-aware"><img src="${ IMAGE_SRC }" alt="current" class="has-aspect-ratio" style="aspect-ratio:16/9"/></figure><div class="wp-block-media-text__content"><!-- wp:paragraph -->
<p>Current</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->`,
				status: 'publish',
			} );
			await page.goto( post.link );

			const current = await computedStyles( page, 'current' );
			expect( current.objectFit ).toBe( 'cover' );
			expect( current.boxRatio ).toBeCloseTo( 16 / 9, 1 );

			// Legacy markup in the same post is untouched.
			const legacy = await computedStyles( page, 'legacy' );
			expect( legacy.objectFit ).toBe( 'fill' );
			expect( legacy.aspectRatio ).toBe( 'auto' );
		} );

		test( 'crops media when the ratio comes from Global Styles', async ( {
			page,
			requestUtils,
		} ) => {
			const stylesPostId =
				await requestUtils.getCurrentThemeGlobalStylesPostId();
			await requestUtils.rest( {
				method: 'POST',
				path: `/wp/v2/global-styles/${ stylesPostId }`,
				data: {
					id: stylesPostId,
					styles: {
						blocks: {
							'core/media-text': {
								dimensions: { aspectRatio: '16/9' },
							},
						},
					},
				},
			} );

			const post = await requestUtils.createPost( {
				title: 'Aspect ratio from Global Styles',
				content: `${ LEGACY_BLOCK }\n\n${ CURRENT_BLOCK }`,
				status: 'publish',
			} );
			await page.goto( post.link );

			// The ratio and the fit arrive together on current markup.
			const current = await computedStyles( page, 'current' );
			expect( current.aspectRatio ).toBe( '16 / 9' );
			expect( current.objectFit ).toBe( 'cover' );
			expect( current.boxRatio ).toBeCloseTo( 16 / 9, 1 );

			// Legacy markup gets neither, so it cannot be distorted.
			const legacy = await computedStyles( page, 'legacy' );
			expect( legacy.aspectRatio ).toBe( 'auto' );
			expect( legacy.objectFit ).toBe( 'fill' );
		} );
	} );
} );
