/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import './style.scss';
import edit from './edit';

export const name = 'core/latest-comments';

export const settings = {
	title: __( 'Latest Comments' ),

	description: __( 'Shows a list of your site\'s most recent comments.' ),

	icon: 'list-view',

	category: 'widgets',

	keywords: [ __( 'recent comments' ) ],

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: edit,

	save() {
		return null;
	},
};
