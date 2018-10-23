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

	icon: <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><g><path d="M22 4l-2-2H4L2 4v12l2 2h14l4 4V4zm-2 0v13l-1-1H4V4h16z" /><path d="M6 12h12v2H6zM6 9h12v2H6zM6 6h12v2H6z" /></g></svg>,

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
