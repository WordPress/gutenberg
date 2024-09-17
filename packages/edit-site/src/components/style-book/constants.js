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
		exclude: [ 'core/home-link' ],
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
/*

  name: slug/identifier for the category // @TODO maybe rename to `slug` after the results of getCategories()
  subcategories: array of subcategories
  title: display name for the category
  include: block to display in the category in addition to any registered blocks in that category.
  exclude: block to exclude from the category.
  onClick: function to call when the category's blocks are clicked. Overrides the default behavior.
 */
export const STYLE_BOOK_CATEGORIES = [
/*	{
		// Clicking examples on the landing tab
		// will take you to the corresponding
		// tab in the style book. E.g., image > media
		// So the click events have to be handled separately.
		name: 'overview',
		title: __( 'Overview' ),
		blocks: [
			// colors
			'custom/colors',
			'core/heading',
			'core/paragraph',
			'core/image',
			'core/separator',
			'core/buttons',
			'core/pull-quote',
			'core/search',
		],
	},*/
	{
		name: 'text',
		title: __( 'Text' ),
		blocks: [ 'core/post-content', 'core/home-link' ],
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

/*	{
		name: 'embed',
		title: __( 'Embeds' ),
		include: [],
	},*/
];

