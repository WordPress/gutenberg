/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { mapMarker as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Site Title' ),
	description: __(
		'Displays and allows editing the name of the site. The site title usually appears in the browser title bar, in search results, and more. Also available in Settings > General.'
	),
	icon,
	edit,
};
