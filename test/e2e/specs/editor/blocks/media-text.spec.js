const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// 50 characters with no spaces — long enough to wrap if overflow-wrap is anywhere.
const LONG_BUTTON_LABEL = 'A'.repeat( 50 );
// Long enough to inflate the Media & Text content column without mid-word wrapping.
const LONG_UNBROKEN_TEXT = 'A'.repeat( 200 );

async function expectNoHorizontalPageScroll( page ) {
	await expect
		.poll( async () => {
			return page.evaluate( () => {
				const root = document.documentElement;
				return root.scrollWidth - root.clientWidth;
			} );
		} )
		.toBeLessThanOrEqual( 1 );
}

test.describe( 'Media & Text', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should keep a nested Search button with a long custom label on one line', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/media-text',
			attributes: {
				mediaType: 'image',
				mediaUrl: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
			},
			innerBlocks: [
				{
					name: 'core/search',
					attributes: {
						label: 'Search',
						showLabel: false,
						buttonUseIcon: false,
						buttonPosition: 'button-outside',
						buttonText: LONG_BUTTON_LABEL,
					},
				},
			],
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const button = page.locator(
			'.wp-block-media-text__content .wp-block-search__button'
		);
		await expect( button ).toBeVisible();
		await expect( button ).toHaveCSS( 'overflow-wrap', 'normal' );

		// Wrapped labels roughly double the button height (ciampo: ~31px → ~46px).
		await expect
			.poll( async () => {
				return button.evaluate( ( el ) => {
					const {
						paddingTop,
						paddingBottom,
						borderTopWidth,
						borderBottomWidth,
						lineHeight,
					} = window.getComputedStyle( el );
					const verticalChrome =
						parseFloat( paddingTop ) +
						parseFloat( paddingBottom ) +
						parseFloat( borderTopWidth ) +
						parseFloat( borderBottomWidth );
					const singleLineHeight =
						parseFloat( lineHeight ) + verticalChrome;
					return el.getBoundingClientRect().height / singleLineHeight;
				} );
			} )
			.toBeLessThan( 1.35 );
	} );

	const nestedWrappingCases = [
		{
			name: 'Quote',
			selector: '.wp-block-media-text__content .wp-block-quote',
			innerBlocks: [
				{
					name: 'core/quote',
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: LONG_UNBROKEN_TEXT },
						},
					],
				},
			],
		},
		{
			name: 'Embed caption',
			selector: '.wp-block-media-text__content .wp-block-embed',
			innerBlocks: [
				{
					name: 'core/embed',
					attributes: {
						url: 'https://wordpress.org/gutenberg',
						caption: LONG_UNBROKEN_TEXT,
					},
				},
			],
		},
		{
			name: 'Verse',
			selector: '.wp-block-media-text__content .wp-block-verse',
			innerBlocks: [
				{
					name: 'core/verse',
					attributes: { content: LONG_UNBROKEN_TEXT },
				},
			],
		},
	];

	for ( const wrappingCase of nestedWrappingCases ) {
		test( `should keep nested ${ wrappingCase.name } wrapping so the page does not scroll horizontally`, async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/media-text',
				attributes: {
					mediaType: 'image',
					mediaUrl: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
				},
				innerBlocks: wrappingCase.innerBlocks,
			} );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			const nested = page.locator( wrappingCase.selector );
			await expect( nested.first() ).toBeVisible();
			await expect( nested.first() ).toHaveCSS(
				'overflow-wrap',
				'anywhere'
			);
			await expectNoHorizontalPageScroll( page );
		} );
	}

	test( 'should keep nested Latest Posts titles wrapping so the page does not scroll horizontally', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/posts',
			data: {
				title: LONG_UNBROKEN_TEXT,
				status: 'publish',
				content: 'Latest Posts overflow-wrap fixture.',
			},
		} );

		await editor.insertBlock( {
			name: 'core/media-text',
			attributes: {
				mediaType: 'image',
				mediaUrl: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
			},
			innerBlocks: [
				{
					name: 'core/latest-posts',
					attributes: {
						postsToShow: 1,
						displayPostContent: false,
					},
				},
			],
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const latestPostsItem = page.locator(
			'.wp-block-media-text__content .wp-block-latest-posts li'
		);
		await expect( latestPostsItem.first() ).toBeVisible();
		await expect( latestPostsItem.first() ).toHaveCSS(
			'overflow-wrap',
			'anywhere'
		);
		await expectNoHorizontalPageScroll( page );
	} );

	test( 'should keep nested Author Biography wrapping so the page does not scroll horizontally', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const me = await requestUtils.rest( {
			method: 'GET',
			path: '/wp/v2/users/me',
			params: { context: 'edit' },
		} );
		const previousDescription = me.description ?? '';

		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/users/me',
			data: { description: LONG_UNBROKEN_TEXT },
		} );

		try {
			await editor.insertBlock( {
				name: 'core/media-text',
				attributes: {
					mediaType: 'image',
					mediaUrl: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
				},
				innerBlocks: [ { name: 'core/post-author-biography' } ],
			} );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			const biography = page.locator(
				'.wp-block-media-text__content .wp-block-post-author-biography'
			);
			await expect( biography ).toBeVisible();
			await expect( biography ).toHaveCSS( 'overflow-wrap', 'anywhere' );
			await expectNoHorizontalPageScroll( page );
		} finally {
			await requestUtils.rest( {
				method: 'POST',
				path: '/wp/v2/users/me',
				data: { description: previousDescription },
			} );
		}
	} );
} );
