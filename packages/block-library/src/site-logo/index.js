/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { siteLogo as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: _x( 'Site Logo', 'block title' ),
	description: __(
		'Useful for displaying a graphic mark, design, or symbol to represent the site. Once a site logo is set, it can be reused in different places and templates. It should not be confused with the site icon, which is the small image used in the dashboard, browser tabs, public search results, etc, to help recognize a site.'
	),
	icon,
	styles: [
		{
			name: 'default',
			label: _x( 'Default', 'block style' ),
			isDefault: true,
		},
		{ name: 'rounded', label: _x( 'Rounded', 'block style' ) },
	],
	supports: {
		align: true,
		alignWide: false,
	},
	edit,
};
