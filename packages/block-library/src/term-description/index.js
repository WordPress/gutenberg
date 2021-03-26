/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { termDescription as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Term Description', 'block title' ),
	description: __(
		'Display the description of categories, tags and custom taxonomies when viewing an archive.'
	),
	icon,
	edit,
};
