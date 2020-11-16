/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'horizontal',
		isDefault: true,
		title: __( 'Navigation (horizontal)' ),
		description: __( 'Links shown in a row.' ),
		attributes: { orientation: 'horizontal' },
		scope: [ 'inserter', 'transform' ],
	},
	{
		name: 'vertical',
		title: __( 'Navigation (vertical)' ),
		description: __( 'Links shown in a column.' ),
		attributes: { orientation: 'vertical' },
		scope: [ 'inserter', 'transform' ],
	},
];

export default variations;
