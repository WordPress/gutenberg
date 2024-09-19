/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const STYLE_BOOK_THEME_SUBCATEGORIES = [
	{
		name: 'site-identity',
		title: __( 'Site Identity' ),
		blocks: [ 'core/site-logo', 'core/site-title', 'core/site-tagline' ],
	},
	{
		name: 'design',
		title: __( 'Design' ),
		blocks: [ 'core/navigation', 'core/avatar', 'core/post-time-to-read' ],
		exclude: [ 'core/home-link', 'core/navigation-link' ],
	},
	{
		name: 'posts',
		title: __( 'Posts' ),
		blocks: [
			'core/post-title',
			'core/post-excerpt',
			'core/post-author',
			'core/post-author-name',
			'core/post-author-biography',
			'core/post-date',
			'core/post-terms',
			'core/term-description',
			'core/query-title',
			'core/query-no-results',
			'core/query-pagination',
			'core/query-numbers',
		],
	},
	{
		name: 'comments',
		title: __( 'Comments' ),
		blocks: [
			'core/comments-title',
			'core/comments-pagination',
			'core/comments-pagination-numbers',
			'core/comments',
			'core/comments-author-name',
			'core/comment-content',
			'core/comment-date',
			'core/comment-edit-link',
			'core/comment-reply-link',
			'core/comment-template',
			'core/post-comments-count',
			'core/post-comments-link',
		],
	},
];

export const STYLE_BOOK_CATEGORIES = [
	{
		name: 'text',
		title: __( 'Text' ),
		blocks: [
			'core/post-content',
			'core/home-link',
			'core/navigation-link',
		],
	},
	{
		name: 'colors',
		title: __( 'Colors' ),
		blocks: [ 'custom/colors' ],
	},
	{
		name: 'theme',
		title: __( 'Theme' ),
		subcategories: STYLE_BOOK_THEME_SUBCATEGORIES,
	},
	{
		name: 'media',
		title: __( 'Media' ),
		blocks: [ 'core/post-featured-image' ],
	},
	{
		name: 'widgets',
		title: __( 'Widgets' ),
		blocks: [],
	},
	{
		name: 'embed',
		title: __( 'Embeds' ),
		include: [],
	},
];

// The content area of the Style Book is rendered within an iframe so that global styles
// are applied to elements within the entire content area. To support elements that are
// not part of the block previews, such as headings and layout for the block previews,
// additional CSS rules need to be passed into the iframe. These are hard-coded below.
// Note that button styles are unset, and then focus rules from the `Button` component are
// applied to the `button` element, targeted via `.edit-site-style-book__example`.
// This is to ensure that browser default styles for buttons are not applied to the previews.
export const STYLE_BOOK_IFRAME_STYLES = `
	// Forming a "block formatting context" to prevent margin collapsing.
	// @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Block_formatting_context
	.is-root-container {
		display: flow-root;
	}
	
	body {
		position: relative;
		padding: 32px !important;
	}

	.edit-site-style-book__examples {
		max-width: 1200px;
		margin: 0 auto;
	}

	.edit-site-style-book__example {
	    max-width: 900px
		border-radius: 2px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 40px;
		margin-bottom: 40px;
		padding: 16px;
		width: 100%;
		box-sizing: border-box;
		scroll-margin-top: 32px;
		scroll-margin-bottom: 32px;
	}

	.edit-site-style-book__example.is-selected {
		box-shadow: 0 0 0 1px var(--wp-components-color-accent, var(--wp-admin-theme-color, #007cba));
	}

	.edit-site-style-book__example:focus:not(:disabled) {
		box-shadow: 0 0 0 var(--wp-admin-border-width-focus) var(--wp-components-color-accent, var(--wp-admin-theme-color, #007cba));
		outline: 3px solid transparent;
	}

	.edit-site-style-book__examples.is-wide .edit-site-style-book__example {
		flex-direction: row;
	}

	.edit-site-style-book__example-title {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
		font-size: 11px;
		font-weight: 500;
		line-height: normal;
		margin: 0;
		text-align: left;
		text-transform: uppercase;
	}

	.edit-site-style-book__examples.is-wide .edit-site-style-book__example-title {
		text-align: right;
		width: 120px;
	}

	.edit-site-style-book__example-preview {
		width: 100%;
	}

	.edit-site-style-book__example-preview .block-editor-block-list__insertion-point,
	.edit-site-style-book__example-preview .block-list-appender {
		display: none;
	}

	.edit-site-style-book__example-preview .is-root-container > .wp-block:first-child {
		margin-top: 0;
	}
	.edit-site-style-book__example-preview .is-root-container > .wp-block:last-child {
		margin-bottom: 0;
	}
	.edit-site-style-book__subcategory-label {
		margin-bottom: 40px;
    	border-bottom: 1px solid #ddd;
    	padding-bottom: 8px;
	}
`;
