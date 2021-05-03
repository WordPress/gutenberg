/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import icon from './icon';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Site Tagline', 'block title' ),
	description: __( 'In a few words, what this site is about.' ),
	keywords: [ __( 'description' ) ],
	icon,
	edit,
};
