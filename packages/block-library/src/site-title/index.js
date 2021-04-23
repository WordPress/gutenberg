/**
 * WordPress dependencies
 */
import { mapMarker as icon } from '@wordpress/icons';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	description: createInterpolateElement(
		__(
			'Displays and allows editing the name of the site. The site title usually appears in the browser title bar, in search results, and more. Also available in <a>Settings > General</a>.'
		),
		// eslint-disable-next-line jsx-a11y/anchor-has-content
		{ a: <a href="options-general.php" target="_blank" /> }
	),
	icon,
	edit,
};
