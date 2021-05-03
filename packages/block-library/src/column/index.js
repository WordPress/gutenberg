/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { column as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Column', 'block title' ),
	icon,
	description: __( 'A single column within a columns block.' ),
	edit,
	save,
	deprecated,
};
