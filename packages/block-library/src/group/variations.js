/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'group-row',
		title: __( 'Row' ),
		description: __( 'Blocks shown in a row.' ),
		attributes: { layout: { type: 'flex', allowOrientation: false } },
		scope: [ 'inserter' ],
		isActive: ( blockAttributes ) =>
			blockAttributes.layout?.type === 'flex',
	},
];

export default variations;
