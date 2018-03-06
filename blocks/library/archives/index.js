/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import ArchivesBlock from './block';

export const name = 'core/archives';

export const settings = {
	title: __( 'Archives' ),

	icon: 'calendar-alt',

	category: 'widgets',

	keywords: [ __( 'archives' ) ],

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: ArchivesBlock,

	save() {

		// Handled by PHP.
		return null;
	},
};
