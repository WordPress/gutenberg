/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { list, grid } from '@wordpress/icons';

const createInnerBlocks = ( groupMetadata, groupStyle = {} ) => [
	[
		'core/group',
		{
			layout: {
				type: 'flex',
				orientation: 'horizontal',
			},
			style: {
				spacing: {
					blockGap: '0.5rem',
				},
				...groupStyle,
			},
			metadata: {
				name: groupMetadata,
			},
		},
		[
			[
				'core/paragraph',
				{
					metadata: {
						name: __( 'Term Name' ),
						bindings: {
							content: {
								source: 'core/term-data',
								args: {
									key: 'name',
								},
							},
						},
					},
				},
			],
			[
				'core/paragraph',
				{
					placeholder: __( '(count)' ),
					metadata: {
						name: __( 'Term Count' ),
						bindings: {
							content: {
								source: 'core/term-data',
								args: {
									key: 'count',
								},
							},
						},
					},
				},
			],
		],
	],
];

const variations = [
	{
		name: 'list',
		title: __( 'List' ),
		description: __( 'Display terms in a list layout.' ),
		attributes: { layout: { type: 'default' } },
		isDefault: true,
		icon: list,
		scope: [ 'block', 'inserter' ],
		innerBlocks: createInnerBlocks( __( 'Term Name with Count' ) ),
	},
	{
		name: 'grid',
		title: __( 'Grid' ),
		description: __( 'Display terms in a grid layout.' ),
		attributes: { layout: { type: 'grid', columnCount: 3 } },
		icon: grid,
		scope: [ 'block', 'inserter' ],
		innerBlocks: createInnerBlocks( __( 'Term Card' ), {
			padding: '1rem',
		} ),
	},
];

export default variations;
