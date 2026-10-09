const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// 50 characters with no spaces — long enough to wrap if overflow-wrap is anywhere.
const LONG_BUTTON_LABEL = 'A'.repeat( 50 );
// Long enough to inflate the Media & Text content column without mid-word wrapping.
const LONG_UNBROKEN_TEXT = 'A'.repeat( 200 );
// Shorter string for the custom opt-out height check (matches ciampo's reproduction).
const OPT_OUT_UNBROKEN_TEXT = 'A'.repeat( 50 );

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

// When the long string also appears in theme chrome (adjacent post nav, author
// bio outside the block), page scrollWidth is not a reliable signal. Assert the
// Media & Text block itself does not overflow its client box.
async function expectMediaTextContentFits( page ) {
	await expect
		.poll( async () => {
			return page.evaluate( () => {
				const mediaText = document.querySelector(
					'.wp-block-media-text'
				);
				return mediaText.scrollWidth - mediaText.clientWidth;
			} );
		} )
		.toBeLessThanOrEqual( 1 );
}

async function expectNestedSearchButtonLabelSingleLine( page, buttonText ) {
	const button = page.locator(
		'.wp-block-media-text__content .wp-block-search__button'
	);
	await expect( button ).toBeVisible();
	await expect( button ).toHaveCSS( 'overflow-wrap', 'normal' );

	if ( buttonText.includes( '<strong>' ) || buttonText.includes( '<em>' ) ) {
		const formattedLabel = button.locator( 'strong, em' ).first();
		await expect( formattedLabel ).toBeVisible();
		await expect( formattedLabel ).toHaveCSS( 'overflow-wrap', 'normal' );
	}

	// Wrapped labels roughly double the button height (ciampo: ~31px → ~46px).
	// line-height may be `normal` (e.g. emptytheme), so fall back to font-size.
	await expect
		.poll( async () => {
			return button.evaluate( ( el ) => {
				const {
					paddingTop,
					paddingBottom,
					borderTopWidth,
					borderBottomWidth,
					lineHeight,
					fontSize,
				} = window.getComputedStyle( el );
				const verticalChrome =
					parseFloat( paddingTop ) +
					parseFloat( paddingBottom ) +
					parseFloat( borderTopWidth ) +
					parseFloat( borderBottomWidth );
				const parsedLineHeight = parseFloat( lineHeight );
				const resolvedLineHeight = Number.isFinite( parsedLineHeight )
					? parsedLineHeight
					: parseFloat( fontSize ) * 1.2;
				const singleLineHeight = resolvedLineHeight + verticalChrome;
				return el.getBoundingClientRect().height / singleLineHeight;
			} );
		} )
		.toBeLessThan( 1.35 );
}

test.describe( 'Media & Text', () => {
	// emptytheme has no `.entry-content p { overflow-wrap: break-word }`, so a
	// custom `.no-break { overflow-wrap: normal }` opt-out can reach nested
	// paragraphs via inheritance — matching ciampo's reproduction.
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	for ( const { description, buttonText } of [
		{
			description: 'plain',
			buttonText: LONG_BUTTON_LABEL,
		},
		{
			description: 'bold',
			buttonText: `<strong>${ LONG_BUTTON_LABEL }</strong>`,
		},
	] ) {
		// eslint-disable-next-line playwright/expect-expect -- Asserted in the shared helper.
		test( `should keep a nested Search button with a long custom ${ description } label on one line`, async ( {
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
							buttonText,
						},
					},
				],
			} );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			// Assertions live in the helper (overflow-wrap + single-line height).
			await expectNestedSearchButtonLabelSingleLine( page, buttonText );
		} );
	}

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
			name: 'Pullquote',
			selector: '.wp-block-media-text__content .wp-block-pullquote',
			innerBlocks: [
				{
					name: 'core/pullquote',
					attributes: { value: LONG_UNBROKEN_TEXT },
				},
			],
		},
		{
			name: 'Code',
			selector: '.wp-block-media-text__content .wp-block-code',
			innerBlocks: [
				{
					name: 'core/code',
					attributes: { content: LONG_UNBROKEN_TEXT },
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
		{
			name: 'Column',
			selector: '.wp-block-media-text__content .wp-block-column',
			innerBlocks: [
				{
					name: 'core/columns',
					innerBlocks: [
						{
							name: 'core/column',
							innerBlocks: [
								{
									name: 'core/paragraph',
									attributes: {
										content: LONG_UNBROKEN_TEXT,
									},
								},
							],
						},
					],
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
		const category = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/categories',
			data: {
				name: `Media Text Overflow ${ Date.now() }`,
			},
		} );

		const fixturePost = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/posts',
			data: {
				title: LONG_UNBROKEN_TEXT,
				status: 'publish',
				categories: [ category.id ],
				content: 'Latest Posts overflow-wrap fixture.',
			},
		} );

		try {
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
							categories: [ { id: category.id } ],
						},
					},
				],
			} );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			const latestPostsItem = page.locator(
				'.wp-block-media-text__content .wp-block-latest-posts li'
			);
			await expect( latestPostsItem ).toHaveCount( 1 );
			await expect( latestPostsItem ).toContainText( LONG_UNBROKEN_TEXT );
			await expect( latestPostsItem ).toHaveCSS(
				'overflow-wrap',
				'anywhere'
			);
			// Long titles can also appear in theme post navigation outside the
			// block, so assert on Media & Text not overflowing its client box.
			await expectMediaTextContentFits( page );
		} finally {
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/posts/${ fixturePost.id }`,
				params: { force: true },
			} );
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/categories/${ category.id }`,
				params: { force: true },
			} );
		}
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
			// The same bio can render in theme chrome outside Media & Text, so
			// assert on the block not overflowing its client box.
			await expectMediaTextContentFits( page );
		} finally {
			await requestUtils.rest( {
				method: 'POST',
				path: '/wp/v2/users/me',
				data: { description: previousDescription },
			} );
		}
	} );

	test( 'should preserve a nested custom overflow-wrap: normal opt-out', async ( {
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
					name: 'core/group',
					attributes: {
						className: 'no-break',
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: { content: OPT_OUT_UNBROKEN_TEXT },
						},
					],
				},
			],
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await page.addStyleTag( {
			content: `
				.no-break {
					width: 220px;
					word-break: normal;
					overflow-wrap: normal;
					font-family: Arial, sans-serif;
					font-size: 16px;
					line-height: 24px;
				}
			`,
		} );

		const optOut = page.locator(
			'.wp-block-media-text__content .no-break'
		);
		await expect( optOut ).toBeVisible();
		await expect( optOut ).toHaveCSS( 'overflow-wrap', 'normal' );

		const paragraph = optOut.locator( 'p' ).first();
		await expect( paragraph ).toHaveCSS( 'overflow-wrap', 'normal' );
		// With overflow-wrap: normal the 50 A's stay on one line (~24px).
		// anywhere would wrap them to multiple lines (~72px at 220px width).
		await expect
			.poll( async () => {
				return paragraph.evaluate(
					( el ) => el.getBoundingClientRect().height
				);
			} )
			.toBeLessThanOrEqual( 30 );
	} );
} );
