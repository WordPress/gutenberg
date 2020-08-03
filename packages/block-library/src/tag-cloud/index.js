/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { tag as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Tag Cloud' ),
	description: __( 'A cloud of your most used tags.' ),
	icon,
	example: {},
	edit,
};
