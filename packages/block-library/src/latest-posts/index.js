/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/latest-posts';

export const settings = {
	title: __( 'Latest Posts' ),

	description: __( 'Display a list of your most recent posts.' ),

	icon: <svg version="1" width="24" height="24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M13 8h5v2h-5zM13 15h5v2h-5z"/><path d="M19 3H5L3 5v14l2 2h14l2-2V5l-2-2zm0 16H5V5h14v14z"/><path d="M11 6H6v5h5V6zm-1 4H7V7h3v3zM11 13H6v5h5v-5zm-1 4H7v-3h3v3z"/></svg>,

	category: 'widgets',

	keywords: [ __( 'recent posts' ) ],

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit,

	save() {
		return null;
	},
};
