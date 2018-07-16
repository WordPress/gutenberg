/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/archives';

export const settings = {
	title: __( 'Archives' ),

	description: __( 'Display a monthly archive of your site’s Posts.' ),

	icon: 'calendar-alt',

	category: 'widgets',

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'center' === align ) {
			return { 'data-align': align };
		}
	},

	edit,

	save() {
		// Handled by PHP.
		return null;
	},
};
