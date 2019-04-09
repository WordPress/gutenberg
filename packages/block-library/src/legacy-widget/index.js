/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/legacy-widget';

export const settings = {
	title: __( 'Legacy Widget (Experimental)' ),

	description: __( 'Display a legacy widget.' ),

	icon,

	category: 'widgets',

	supports: {
		html: false,
	},

	edit,
};
