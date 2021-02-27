/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { category as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import variations from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Post Categories', 'block title' ),
	description: __( "Display a post's categories." ),
	variations,
	icon,
	edit,
};
