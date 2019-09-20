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
	example: {
		attributes: {
			content: '<p>' + __( 'Welcome to the world of blocks.' ) + '</p>',
		},
	},
	supports: {
		html: false,
	},
	transforms,
	edit,
	save,
};
