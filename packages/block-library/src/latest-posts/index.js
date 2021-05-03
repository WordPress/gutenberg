/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { postList as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Latest Posts', 'block title' ),
	description: __( 'Display a list of your most recent posts.' ),
	icon,
	keywords: [ __( 'recent posts' ) ],
	example: {},
	edit,
	deprecated,
};
