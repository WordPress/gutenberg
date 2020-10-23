/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	titleDate,
	titleExcerpt,
	titleDateExcerpt,
	titleContent,
} from './icons';

const variations = [
	{
		name: 'title-date',
		title: __( 'Title and Date' ),
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
		title: __( 'Title and Excerpt' ),
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
		title: __( 'Title, Date and Excerpt' ),
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
		name: 'title-content',
		title: __( 'Title and Content' ),
		icon: titleContent,
		innerBlocks: [
			[
				'core/query-loop',
				{},
				[ [ 'core/post-title' ], [ 'core/post-content' ] ],
			],
		],
		scope: [ 'block' ],
	},
];

export default variations;
