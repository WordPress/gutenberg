/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { widget as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/legacy-widget';

export const settings = {
	title: __( 'Legacy Widget (Experimental)' ),
	description: __( 'Display a legacy widget.' ),
	icon,
	category: 'widgets',
	supports: {
		html: false,
		customClassName: false,
	},
	edit,
};
