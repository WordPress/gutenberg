/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { gallery as sliderIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	titleDate,
	titleExcerpt,
	titleDateExcerpt,
	imageDateTitle,
} from './icons';

const postDate = [
	'core/post-date',
	{
		metadata: {
			bindings: {
				datetime: {
					source: 'core/post-data',
					args: { field: 'date' },
				},
			},
		},
	},
];

const variations = [
	{
		name: 'slider',
		title: __( 'Slider' ),
		icon: sliderIcon,
		attributes: {
			className: 'is-style-slider',
			query: {
				perPage: 10,
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
		innerBlocks: [
			[ 'core/slider-controls' ],
			[
				'core/post-template',
				{
					className: 'is-slider-track',
				},
				[ [ 'core/post-featured-image' ], [ 'core/post-title' ] ],
			],
		],
		scope: [ 'block', 'inserter' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.className?.includes( 'is-style-slider' ),
	},
	{
		name: 'title-date',
		title: __( 'Title & Date' ),
		icon: titleDate,
		attributes: {},
		innerBlocks: [
			[ 'core/post-template', {}, [ [ 'core/post-title' ], postDate ] ],
			[ 'core/query-pagination' ],
			[ 'core/query-no-results' ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'title-excerpt',
		title: __( 'Title & Excerpt' ),
		icon: titleExcerpt,
		attributes: {},
		innerBlocks: [
			[
				'core/post-template',
				{},
				[ [ 'core/post-title' ], [ 'core/post-excerpt' ] ],
			],
			[ 'core/query-pagination' ],
			[ 'core/query-no-results' ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'title-date-excerpt',
		title: __( 'Title, Date, & Excerpt' ),
		icon: titleDateExcerpt,
		attributes: {},
		innerBlocks: [
			[
				'core/post-template',
				{},
				[ [ 'core/post-title' ], postDate, [ 'core/post-excerpt' ] ],
			],
			[ 'core/query-pagination' ],
			[ 'core/query-no-results' ],
		],
		scope: [ 'block' ],
	},
	{
		name: 'image-date-title',
		title: __( 'Image, Date, & Title' ),
		icon: imageDateTitle,
		attributes: {},
		innerBlocks: [
			[
				'core/post-template',
				{},
				[
					[ 'core/post-featured-image' ],
					postDate,
					[ 'core/post-title' ],
				],
			],
			[ 'core/query-pagination' ],
			[ 'core/query-no-results' ],
		],
		scope: [ 'block' ],
	},
];

export default variations;
