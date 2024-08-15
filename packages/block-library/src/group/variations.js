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
				customTextColor: '#cf2e2e',
				fontSize: 'large',
				content: __( 'One.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				customTextColor: '#ff6900',
				fontSize: 'large',
				content: __( 'Two.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				customTextColor: '#fcb900',
				fontSize: 'large',
				content: __( 'Three.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				customTextColor: '#00d084',
				fontSize: 'large',
				content: __( 'Four.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				customTextColor: '#0693e3',
				fontSize: 'large',
				content: __( 'Five.' ),
			},
		},
		{
			name: 'core/paragraph',
			attributes: {
				customTextColor: '#9b51e0',
				fontSize: 'large',
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
		isActive: ( blockAttributes ) =>
			! blockAttributes.layout ||
			! blockAttributes.layout?.type ||
			blockAttributes.layout?.type === 'default' ||
			blockAttributes.layout?.type === 'constrained',
		icon: group,
	},
	{
		name: 'group-row',
		title: _x( 'Row', 'single horizontal line' ),
		description: __( 'Arrange blocks horizontally.' ),
		attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex' &&
			( ! blockAttributes.layout?.orientation ||
				blockAttributes.layout?.orientation === 'horizontal' ),
		icon: row,
		example,
	},
	{
		name: 'group-stack',
		title: __( 'Stack' ),
		description: __( 'Arrange blocks vertically.' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex' &&
			blockAttributes.layout?.orientation === 'vertical',
		icon: stack,
		example,
	},
	{
		name: 'group-grid',
		title: __( 'Grid' ),
		description: __( 'Arrange blocks in a grid.' ),
		attributes: { layout: { type: 'grid' } },
		scope: [ 'block', 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'grid',
		icon: grid,
		example,
	},
];

export default variations;
