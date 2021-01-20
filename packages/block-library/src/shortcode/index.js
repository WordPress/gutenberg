/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { shortcode as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import transforms from './transforms';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Shortcode', 'block title' ),
	description: __(
		'Insert additional custom elements with a WordPress shortcode.'
	),
	icon,
	transforms,
	edit,
	save,
};
