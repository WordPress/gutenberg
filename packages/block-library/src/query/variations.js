/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	titleDate,
	titleExcerpt,
	titleDateExcerpt,
	imageDateTitle,
} from './icons';

const variations = [
	{
		name: 'posts-list',
		title: __( 'Posts List' ),
		description: __(
			'Display a list of your most recent posts, excluding sticky posts.'
		),
		icon: postList,
		attributes: {
			query: {
				perPage: 4,
				pages: 1,
				offset: 0,
				postType: 'post',
				categoryIds: [],
				tagIds: [],
				order: 'desc',
				orderBy: 'date',
				author: '',
				search: '',
				sticky: 'exclude',
			},
		},
		scope: [ 'inserter' ],
	},
	{
		name: 'title-date',
		title: __( 'Title & Date' ),
		icon: titleDate,
		innerBlocks: [
			[
				'core/query-loop',
				{},
				[ [ 'core/post-title' ], [ 'core/post-date' ] ],
			],
		],
		scope: [ 'block' ],
	},
	{
		name: 'title-excerpt',
		title: __( 'Title & Excerpt' ),
		icon: titleExcerpt,
		innerBlocks: [
			[
				'core/query-loop',
				{},
				[ [ 'core/post-title' ], [ 'core/post-excerpt' ] ],
			],
		],
		scope: [ 'block' ],
	},
	{
		name: 'title-date-excerpt',
		title: __( 'Title, Date, & Excerpt' ),
		icon: titleDateExcerpt,
		innerBlocks: [
			[
				'core/query-loop',
				{},
				[
					[ 'core/post-title' ],
					[ 'core/post-date' ],
					[ 'core/post-excerpt' ],
				],
			],
		],
		scope: [ 'block' ],
	},
	{
		name: 'image-date-title',
		title: __( 'Image, Date, & Title' ),
		icon: imageDateTitle,
		innerBlocks: [
			[
				'core/query-loop',
				{},
				[
					[ 'core/post-featured-image' ],
					[ 'core/post-date' ],
					[ 'core/post-title' ],
				],
			],
		],
		scope: [ 'block' ],
	},
];

export default variations;
