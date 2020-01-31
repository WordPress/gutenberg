/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { navigation as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Navigation Link' ),

	parent: [ 'core/navigation' ],

	icon,

	description: __( 'Add a page, link, or another item to your navigation.' ),

	supports: {
		reusable: false,
		html: false,
	},

	__experimentalLabel: ( { label } ) => label,

	edit,
	save,
};
