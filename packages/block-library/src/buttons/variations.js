/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'buttons-horizontal',
		isDefault: true,
		title: __( 'Horizontal' ),
		description: __( 'Buttons shown in a row.' ),
		attributes: { layout: { type: 'flex' } },
		scope: [ 'transform' ],
	},
	{
		name: 'buttons-vertical',
		title: __( 'Vertical' ),
		description: __( 'Buttons shown in a column.' ),
		attributes: { layout: { type: 'flex', orientation: 'vertical' } },
		scope: [ 'transform' ],
	},
];

export default variations;
