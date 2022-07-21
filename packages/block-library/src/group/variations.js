/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { group, row, stack } from '@wordpress/icons';

const variations = [
	{
		name: 'group',
		title: __( 'Group' ),
		description: __( 'Gather blocks in a layout container.' ),
		attributes: { layout: { inherit: true } },
		scope: [ 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes.layout ||
			! blockAttributes.layout?.type ||
			blockAttributes.layout?.inherit === true ||
			blockAttributes.layout?.type === 'default',
		icon: group,
	},
	{
		name: 'group-row',
		title: __( 'Row' ),
		description: __( 'Arrange blocks horizontally.' ),
		attributes: { layout: { type: 'flex', flexWrap: 'nowrap' } },
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex' &&
			( ! blockAttributes.layout?.orientation ||
				blockAttributes.layout?.orientation === 'horizontal' ),
		icon: row,
	},
	{
		name: 'group-stack',
		title: __( 'Stack' ),
		description: __( 'Arrange blocks vertically.' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex' &&
			blockAttributes.layout?.orientation === 'vertical',
		icon: stack,
	},
];

export default variations;
