/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { heading, paragraph, list } from '@wordpress/icons';

const variations = [
	{
		name: 'title-date',
		title: __( 'Title and Date' ),
		icon: list,
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
		name: 'title-image',
		title: __( 'Title and Featured Image' ),
		icon: heading,
		innerBlocks: [
			[
				'core/query-loop',
				{},
				[ [ 'core/post-title' ], [ 'core/post-featured-image' ] ],
			],
		],
		scope: [ 'block' ],
	},
	{
		name: 'title-date-excerpt',
		title: __( 'Title, Date and Excerpt' ),
		icon: paragraph,
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
];

export default variations;
