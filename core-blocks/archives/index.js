/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ArchivesBlock from './block';
export const name = 'core/archives';

export const settings = {
	title: __( 'Archives' ),

	description: __( 'This block displays a monthly archive of your site’s Posts.' ),

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

	edit: ArchivesBlock,

	save() {
		// Handled by PHP.
		return null;
	},
};
