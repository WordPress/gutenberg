/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import edit from './edit';

export const name = 'core/latest-comments';

export const settings = {
	title: __( 'Latest Comments' ),

	description: __( 'Show a list of your site’s most recent comments.' ),

	icon: 'list-view',

	category: 'widgets',

	keywords: [ __( 'recent comments' ) ],

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;

		// TODO: Use consistent values across the app;
		// see: https://github.com/WordPress/gutenberg/issues/7908.
		if ( [ 'left', 'center', 'right', 'wide', 'full' ].includes( align ) ) {
			return { 'data-align': align };
		}
	},

	edit,

	save() {
		return null;
	},
};
