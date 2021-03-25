/**
 * WordPress dependencies
 */
import { calendar as icon } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Calendar', 'block title' ),
	description: __( 'A calendar of your site’s posts.' ),
	icon,
	keywords: [ __( 'posts' ), __( 'archive' ) ],
	example: {},
	edit,
};
