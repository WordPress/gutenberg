/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/components';
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

	icon: <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24"><Path d="M12 7.27l4.28 10.43-3.47-1.53-.81-.36-.81.36-3.47 1.53L12 7.27M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" /></SVG>,

	description: __( 'Add a page, link, or another item to your navigation.' ),

	supports: {
		reusable: false,
		html: false,
	},

	__experimentalLabel: ( { label } ) => label,

	edit,
	save,
};

