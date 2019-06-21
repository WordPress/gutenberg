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
	title: __( 'Menu Item (Experimental)' ),

	parent: [ 'core/navigation-menu' ],

	icon: 'admin-links',

	description: __( 'Add a page, link, or other item to your Navigation Menu.' ),

	edit,
	save,
};

