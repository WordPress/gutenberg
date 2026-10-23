import { __, _x } from '@wordpress/i18n';
import { group, row, stack, grid, layout } from '@wordpress/icons';
import type { BlockVariation } from '@wordpress/blocks';

declare global {
	interface Window {
		__experimentalEnableGridInteractivity?: boolean;
	}
}

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

// A full width grid of 12 by 12 cells in manual placement mode, where blocks
// are placed, sized and rotated on the canvas. Manual grids can only be edited
// that way with the grid interactivity experiment, so the variation is only
// offered with it. It sets no padding, so that it gets the theme's padding for
// Groups.
const canvasVariation: BlockVariation = {
	name: 'group-canvas',
	title: __( 'Canvas' ),
	description: __( 'Place blocks anywhere on a grid of cells.' ),
	attributes: {
		align: 'full',
		layout: {
			type: 'grid',
			columnCount: 12,
			rowCount: 12,
			isManualPlacement: true,
		},
	},
	scope: [ 'block', 'inserter', 'transform' ],
	// More specific than the Grid variation, so a manual grid shows as Canvas.
	isActive: [ 'layout.type', 'layout.isManualPlacement' ],
	icon: layout,
};

const variations: BlockVariation[] = [
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
	...( window.__experimentalEnableGridInteractivity
		? [ canvasVariation ]
		: [] ),
];

export default variations;
