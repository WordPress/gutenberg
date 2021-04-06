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
		"Allows you to define a logo to be used across your site. Once defined, changing it in one template will change it in all places where it's used as well."
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
