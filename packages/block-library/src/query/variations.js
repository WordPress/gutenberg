/**
 * WordPress dependencies
 */
import { heading, paragraph, list } from '@wordpress/icons';
const variations = [
	{
		name: 'title-date',
		title: 'Title and Date',
		icon: list,
		attributes: {
			innerBlocksTemplate: [
				[
					'core/query-loop',
					{
						innerBlocksTemplate: [
							[ 'core/post-title' ],
							[ 'core/post-date' ],
						],
					},
				],
			],
		},
	},
	{
		name: 'title-image',
		title: 'Title and Image',
		icon: heading,
		attributes: {
			innerBlocksTemplate: [
				[
					'core/query-loop',
					{
						innerBlocksTemplate: [
							[ 'core/post-title' ],
							[ 'core/post-featured-image' ],
						],
					},
				],
			],
		},
	},
	{
		name: 'title-date-excerpt',
		title: 'Title and Date and Excerpt',
		icon: paragraph,
		// attributes: {
		// 	innerBlocksTemplate: [
		// 		[
		// 			'core/query-loop',
		// 			{
		// 				innerBlocksTemplate: [
		// 					[ 'core/post-title' ],
		// 					[ 'core/post-date' ],
		// 					[ 'core/post-excerpt' ],
		// 				],
		// 			},
		// 		],
		// 	],
		// },
		innerBlocks: [
			[
				'core/query-loop',
				{
					innerBlocksTemplate: [
						[ 'core/post-title' ],
						[ 'core/post-date' ],
						[ 'core/post-excerpt' ],
					],
				},
			],
		],
	},
];

export default variations;
