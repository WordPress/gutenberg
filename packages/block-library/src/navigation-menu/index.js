/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

export const name = 'core/navigation-menu';

export const settings = {
	title: __( 'Navigation Menu (Experimental)' ),

	icon: 'menu',

	description: __( 'Add a navigation menu to your site.' ),

	keywords: [ __( 'menu' ), __( 'navigation' ), __( 'links' ) ],

	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
		html: false,
		inserter: true,
	},

	edit,

	save,

};
