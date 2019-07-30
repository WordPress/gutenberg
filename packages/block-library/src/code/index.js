/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Code' ),
	description: __( 'Display code snippets that respect your spacing and tabs.' ),
	icon,
	supports: {
		html: false,
	},
	transforms,
	edit,
	save,
};
