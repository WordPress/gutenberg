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

	icon: <svg role="img" aria-hidden="true" focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M0,0h24v24H0V0z" fill="none" /><path d="M12,2l-5.5,9h11L12,2z M12,5.84L13.93,9h-3.87L12,5.84z" /><path d="m17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /><path d="m3 21.5h8v-8h-8v8zm2-6h4v4h-4v-4z" /></svg>,

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
		if ( [ 'left', 'center', 'right', 'wide', 'full' ].includes( align ) ) {
			return { 'data-align': align };
		}
	},

	edit,

	save() {
		return null;
	},
};
