const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// 50 characters with no spaces — long enough to wrap if overflow-wrap is anywhere.
const LONG_BUTTON_LABEL = 'A'.repeat( 50 );

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
} );
