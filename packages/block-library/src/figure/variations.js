/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	beforeAfterIcon,
	dataSetIcon,
	codeConsoleIcon,
	multimediaIcon,
	documentIcon,
} from './icon';

const variations = [
	{
		name: 'before-after',
		title: __( 'Before & After' ),
		icon: beforeAfterIcon,
		attributes: { layout: { type: 'default' } },
		innerBlocks: [
			[
				'core/columns',
				{},
				[
					[
						'core/column',
						{},
						[
							[ 'core/heading', { level: 3 } ],
							[ 'core/image' ],
							[ 'core/paragraph' ],
						],
					],
					[
						'core/column',
						{},
						[
							[ 'core/heading', { level: 3 } ],
							[ 'core/image' ],
							[ 'core/paragraph' ],
						],
					],
				],
			],
		],
		scope: [ 'block' ],
	},
	{
		name: 'data-set',
		title: __( 'Data Set' ),
		icon: dataSetIcon,
		attributes: { layout: { type: 'default' } },
		innerBlocks: [
			[
				'core/group',
				{ layout: { type: 'constrained' } },
				[ [ 'core/image' ], [ 'core/table' ] ],
			],
		],
		scope: [ 'block' ],
	},
	{
		name: 'code-console',
		title: __( 'Code & Console' ),
		icon: codeConsoleIcon,
		attributes: { layout: { type: 'default' } },
		innerBlocks: [ [ 'core/code' ], [ 'core/preformatted' ] ],
		scope: [ 'block' ],
	},
	{
		name: 'multimedia',
		title: __( 'Media & Notes' ),
		icon: multimediaIcon,
		attributes: { layout: { type: 'default' } },
		innerBlocks: [
			[ 'core/video' ],
			[
				'core/list',
				{},
				[
					[ 'core/list-item' ],
					[ 'core/list-item' ],
					[ 'core/list-item' ],
				],
			],
		],
		scope: [ 'block' ],
	},
	{
		name: 'document-resource',
		title: __( 'File & Summary' ),
		icon: documentIcon,
		attributes: { layout: { type: 'default' } },
		innerBlocks: [ [ 'core/paragraph' ], [ 'core/file' ] ],
		scope: [ 'block' ],
	},
];

export default variations;
