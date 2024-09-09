/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const STYLE_BOOK_CATEGORIES = [
	{
		name: 'layout',
		label: __( 'Layout' ),
		blocks: [],
	},
	{
		name: 'text',
		label: __( 'Text' ),
		blocks: [ 'core/post-content', 'core/home-link' ],
	},
	{
		name: 'colors',
		label: __( 'Colors' ),
		blocks: [],
	},
	{
		name: 'theme',
		label: __( 'Theme' ),
		categories: [
			{
				name: 'site-identity',
				label: __( 'Site Identity' ),
				blocks: [
					'core/site-logo',
					'core/site-title',
					'core/site-tagline',
				],
			},
			{
				name: 'design',
				label: __( 'Design' ),
				blocks: [
					'core/navigation',
					'core/buttons',
					'core/avatar',
					'core/time-to-read',
					'core/table-of-contents',
					'core/separator',
					'core/more',
					'core/page-break',
				],
			},
			{
				name: 'posts',
				label: __( 'Posts' ),
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
				label: __( 'Comments' ),
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
		],
	},
	{
		name: 'media',
		label: __( 'Media' ),
		blocks: [ 'core/post-featured-image' ],
	},
	{
		name: 'widgets',
		label: __( 'Widgets' ),
		blocks: [],
	},

	{
		name: 'embeds',
		label: __( 'Embeds' ),
		blocks: [],
	},
];
