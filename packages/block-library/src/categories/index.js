/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/categories';

export const settings = {
	title: __( 'Categories' ),

	description: __( 'Display a list of all your site’s categories.' ),

	icon: <svg version="1" width="24" height="24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M12 2l-5 9h11l-6-9zm0 4l2 3h-4l2-3zM18 13a4 4 0 1 0-1 9 4 4 0 0 0 1-9zm0 7a3 3 0 1 1 0-5 3 3 0 0 1 0 5zM3 22h8v-8H3v8zm2-6h4v4H5v-4z"/></svg>,

	category: 'widgets',

	attributes: {
		showPostCounts: {
			type: 'boolean',
			default: false,
		},
		displayAsDropdown: {
			type: 'boolean',
			default: false,
		},
		showHierarchy: {
			type: 'boolean',
			default: false,
		},
		align: {
			type: 'string',
		},
	},

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit,

	save() {
		return null;
	},
};
