/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { customLink as linkIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'List of links', 'block title' ),

	icon: linkIcon,

	description: __( 'Add a list of links to your navigation.' ),

	keywords: [ __( 'links' ) ],

	edit,

	save,
};
