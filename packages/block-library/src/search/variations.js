/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'default',
		isDefault: true,
		attributes: { buttonText: __( 'Search' ), label: __( 'Search' ) },
	},
	{
		name: 'inline',
		title: 'Inline Search',
		attributes: {
			showLabel: false,
			buttonUseIcon: true,
			buttonPosition: 'button-inside',
		},
	},
];

export default variations;
