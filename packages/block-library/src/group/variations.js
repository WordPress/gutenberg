/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { group, row, stack, grid } from '@wordpress/icons';

const example = {
	innerBlocks: [
		{
			name: 'core/paragraph',
			attributes: {
				content: __( 'One.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				content: __( 'Two.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				content: __( 'Three.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				content: __( 'Four.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				content: __( 'Five.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				content: __( 'Six.' ),
			},
		},
	],
};

const variations = [
	{
		name: 'group',
		title: __( 'Group' ),
		description: __( 'Gather blocks in a container.' ),
		attributes: { layout: { type: 'constrained' } },
		isDefault: true,
		scope: [ 'block', 'inserter', 'transform' ],
		icon: group,
	},
	{
		name: 'group-row',
		title: _x( 'Row', 'single horizontal line' ),
		description: __( 'Arrange blocks horizontally.' ),
		attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: [ 'layout.type' ],
		icon: row,
		example,
	},
	{
		name: 'group-stack',
		title: __( 'Stack' ),
		description: __( 'Arrange blocks vertically.' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: [ 'layout.type', 'layout.orientation' ],
		icon: stack,
		example,
	},
	{
		name: 'group-grid',
		title: __( 'Grid' ),
		description: __( 'Arrange blocks in a grid.' ),
		attributes: { layout: { type: 'grid' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: [ 'layout.type' ],
		icon: grid,
		example,
	},
];

export default variations;
