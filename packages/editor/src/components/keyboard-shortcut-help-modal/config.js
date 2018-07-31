/**
 * WordPress dependencies
 */
import { displayShortcut } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

const shortcuts = [
	{
		key: displayShortcut.primary( '/' ),
		description: __( 'Display this help' ),
	},
];

export default shortcuts;
