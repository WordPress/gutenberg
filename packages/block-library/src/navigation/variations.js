/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'horizontal',
		title: __( 'Navigation (horizontal)' ),
		description: __( 'Links shown in a row.' ),
		attributes: { orientation: 'horizontal' },
		scope: [ 'transform' ],
	},
	{
		name: 'vertical',
		title: __( 'Navigation (vertical)' ),
		description: __( 'Links shown in a column.' ),
		attributes: { orientation: 'vertical' },
		scope: [ 'transform' ],
	},
];

export default variations;
