/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Post' ),
	description: __( 'A Post Container block.' ),
	supports: {
		html: false,
	},
	edit,
	save,
};
