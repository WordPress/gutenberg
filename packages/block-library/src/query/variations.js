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

const QUERY_DEFAULT_ATTRIBUTES = {
	query: {
		perPage: 3,
		pages: 0,
		offset: 0,
		postType: 'post',
		order: 'desc',
		orderBy: 'date',
		author: '',
		search: '',
		exclude: [],
		sticky: '',
		inherit: false,
	},
};

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
				order: 'desc',
				orderBy: 'date',
				author: '',
				search: '',
				sticky: 'exclude',
				inherit: false,
			},
		},
		scope: [ 'inserter' ],
	},
	{
		name: 'title-date',
		title: __( 'Title & Date' ),
		icon: titleDate,
		attributes: { ...QUERY_DEFAULT_ATTRIBUTES },
		innerBlocks: [
			[
				'core/post-template',
				{},
				[ [ 'core/post-title' ], [ 'core/post-date' ] ],
			],
			[ 'core/query-pagination' ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'title-excerpt',
		title: __( 'Title & Excerpt' ),
		icon: titleExcerpt,
		attributes: { ...QUERY_DEFAULT_ATTRIBUTES },
		innerBlocks: [
			[
				'core/post-template',
				{},
				[ [ 'core/post-title' ], [ 'core/post-excerpt' ] ],
			],
			[ 'core/query-pagination' ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'title-date-excerpt',
		title: __( 'Title, Date, & Excerpt' ),
		icon: titleDateExcerpt,
		attributes: { ...QUERY_DEFAULT_ATTRIBUTES },
		innerBlocks: [
			[
				'core/post-template',
				{},
				[
					[ 'core/post-title' ],
					[ 'core/post-date' ],
					[ 'core/post-excerpt' ],
				],
			],
			[ 'core/query-pagination' ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'image-date-title',
		title: __( 'Image, Date, & Title' ),
		icon: imageDateTitle,
		attributes: { ...QUERY_DEFAULT_ATTRIBUTES },
		innerBlocks: [
			[
				'core/post-template',
				{},
				[
					[ 'core/post-featured-image' ],
					[ 'core/post-date' ],
					[ 'core/post-title' ],
				],
			],
			[ 'core/query-pagination' ],
		],
		scope: [ 'block' ],
	},
];

export default variations;
