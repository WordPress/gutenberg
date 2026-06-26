/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

const variations = [
	{
		name: 'default',
		isDefault: true,
		// Translatable defaults can't live in `block.json`, so set it here.
		attributes: {
			downloadButtonText: _x( 'Download', 'button label' ),
		},
	},
];

export default variations;
