/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { G, Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/archives';

export const settings = {
	title: __( 'Archives' ),

	description: __( 'Display a monthly archive of your site’s Posts.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path fill="none" d="M0 0h24v24H0V0z" /><G><Path d="M7 11h2v2H7v-2zm14-5v14l-2 2H5l-2-2V6l2-2h1V2h2v2h8V2h2v2h1l2 2zM5 8h14V6H5v2zm14 12V10H5v10h14zm-4-7h2v-2h-2v2zm-4 0h2v-2h-2v2z" /></G></SVG>,

	category: 'widgets',

	supports: {
		html: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( [ 'left', 'center', 'right' ].includes( align ) ) {
			return { 'data-align': align };
		}
	},

	edit,

	save() {
		// Handled by PHP.
		return null;
	},
};
