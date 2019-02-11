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

	description: __( 'Display a monthly archive of your posts.' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path fill="none" d="M0 0h24v24H0V0z" /><G><Path d="M7 11h2v2H7v-2zm14-5v14c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2l.01-14c0-1.1.88-2 1.99-2h1V2h2v2h8V2h2v2h1c1.1 0 2 .9 2 2zM5 8h14V6H5v2zm14 12V10H5v10h14zm-4-7h2v-2h-2v2zm-4 0h2v-2h-2v2z" /></G></SVG>,

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
