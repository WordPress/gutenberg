/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { home } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Home Link', 'block title' ),

	icon: home,

	description: __( 'Link to your homepage.' ),

	keywords: [ __( 'home' ), __( 'menu' ), __( 'navigation' ) ],

	edit,

	save,

	example: {
		attributes: {
			label: _x( 'Home', 'Home Link preview example' ),
		},
	},
};
