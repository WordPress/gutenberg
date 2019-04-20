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

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Reusable Template' ),
	description: __( 'Template block used as a container.' ),
	icon,
	supports: {
		customClassName: false,
		html: false,
		inserter: false,
	},
	edit,
	save,
};
