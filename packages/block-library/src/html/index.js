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
	title: __( 'Custom HTML' ),
	description: __( 'Add custom HTML code and preview it as you edit.' ),
	icon,
	keywords: [ __( 'embed' ) ],
	example: {
		attributes: {
			content: '<p>' + __( 'Welcome to the world of blocks.' ) + '</p>',
		},
	},
	supports: {
		customClassName: false,
		className: false,
		html: false,
	},
	transforms,
	edit,
	save,
};
