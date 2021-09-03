/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'group-row',
		title: __( 'Row' ),
		description: __( 'Blocks shown in a row.' ),
		attributes: { layout: { type: 'flex' } },
		scope: [ 'inserter' ],
	},
];

export default variations;
