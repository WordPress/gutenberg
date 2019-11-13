/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

export const name = 'core/navigation';

export const settings = {
	title: __( 'Navigation' ),

	icon: 'menu',

	description: __( 'Add a navigation block to your site.' ),

	keywords: [ __( 'menu' ), __( 'navigation' ), __( 'links' ) ],

	category: 'layout',

	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
		html: false,
		inserter: true,
	},

	styles: [
		{ name: 'light', label: __( 'Light' ), isDefault: true },
		{ name: 'dark', label: __( 'Dark' ) },
	],

	edit,

	save,

};
