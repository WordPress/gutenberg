/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Navigation Menu (Experimental)' ),

	icon: 'menu',

	description: __( 'Add a navigation menu to your site.' ),

	keywords: [ __( 'menu' ), __( 'navigation' ), __( 'links' ) ],

	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
		html: false,
		inserter: false,
	},

	edit,

	save,

};
