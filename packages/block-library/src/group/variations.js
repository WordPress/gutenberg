/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { row, stack } from '@wordpress/icons';

const variations = [
	{
		name: 'group',
		title: __( 'Group' ),
		description: __( 'Blocks shown in a column.' ),
		attributes: { layout: { type: 'default' } },
		scope: [ 'transform' ],
		isActive: ( blockAttributes ) =>
			! blockAttributes.layout ||
			blockAttributes.layout?.type === 'default',
	},
	{
		name: 'group-row',
		title: __( 'Row' ),
		description: __( 'Blocks shown in a row.' ),
		attributes: { layout: { type: 'flex' } },
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
		description: __( 'Blocks stacked vertically.' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex' &&
			blockAttributes.layout?.orientation === 'vertical',
		icon: stack,
	},
];

export default variations;
