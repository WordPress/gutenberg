/**
 * WordPress dependencies
 */
import { pages as icon } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit.js';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Page List', 'block title' ),
	description: __( 'Display a list of all pages.' ),
	keywords: [ __( 'menu' ), __( 'navigation' ) ],
	icon,
	example: {},
	edit,
};
