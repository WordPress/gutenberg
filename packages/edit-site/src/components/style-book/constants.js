/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/*
  category: slug/identifier for the category
  subCategories: array of subcategories
  label: display name for the category
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
		category: 'overview',
		label: __( 'Overview' ),
		include: [
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
		category: 'text',
		label: __( 'Text' ),
		include: [ 'core/post-content', 'core/home-link' ],
	},
	{
		category: 'colors',
		label: __( 'Colors' ),
		include: [ 'custom/colors' ],
	},
	{
		category: 'theme',
		label: __( 'Theme' ),
		subCategories: [
			{
				category: 'site-identity',
				label: __( 'Site Identity' ),
				include: [
					'core/site-logo',
					'core/site-title',
					'core/site-tagline',
				],
			},
			{
				category: 'design',
				label: __( 'Design' ),
				include: [
					'core/navigation',
					'core/avatar',
					'core/post-time-to-read',
				],
				exclude: [ 'core/home-link' ],
			},
			{
				category: 'posts',
				label: __( 'Posts' ),
				include: [
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
				category: 'comments',
				label: __( 'Comments' ),
				include: [
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
		],
	},
	{
		category: 'media',
		label: __( 'Media' ),
		include: [ 'core/post-featured-image' ],
	},
	{
		category: 'widgets',
		label: __( 'Widgets' ),
		include: [],
	},

/*	{
		category: 'embed',
		label: __( 'Embeds' ),
		include: [],
	},*/
];
