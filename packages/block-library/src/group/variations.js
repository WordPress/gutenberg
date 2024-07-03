/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { group, row, stack, grid } from '@wordpress/icons';

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
	},
	{
		name: 'group-stack',
		title: __( 'Stack' ),
		description: __( 'Arrange blocks vertically.' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: [ 'layout.type', 'layout.orientation' ],
		icon: stack,
	},
	{
		name: 'group-grid',
		title: __( 'Grid' ),
		description: __( 'Arrange blocks in a grid.' ),
		attributes: { layout: { type: 'grid' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: [ 'layout.type' ],
		icon: grid,
	},
];

export default variations;
