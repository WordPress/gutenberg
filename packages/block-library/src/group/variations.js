/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
			blockAttributes.layout?.type === 'flex' && ( ! blockAttributes.layout?.orientation || blockAttributes.layout?.orientation === 'horizontal' ),
	},
	{
		name: 'group-stack',
		title: __( 'Stack' ),
		description: __( 'Blocks stacked in a column.' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex' && blockAttributes.layout?.orientation === 'vertical',
	},
];

export default variations;
