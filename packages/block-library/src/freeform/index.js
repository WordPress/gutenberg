/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { classic as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Classic', 'block title' ),
	description: __( 'Use the classic WordPress editor.' ),
	icon,
	edit,
	save,
};
