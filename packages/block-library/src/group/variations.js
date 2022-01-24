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
			blockAttributes.layout?.type === 'default',
	},
	{
		name: 'group-row',
		title: __( 'Row' ),
		description: __( 'Blocks shown in a row.' ),
		attributes: { layout: { type: 'flex', allowOrientation: false } },
		scope: [ 'inserter', 'transform' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex',
	},
];

export default variations;
