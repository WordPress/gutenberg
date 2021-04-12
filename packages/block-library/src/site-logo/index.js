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
	description: __( 'Displays and enables editing of the site logo.' ),
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
