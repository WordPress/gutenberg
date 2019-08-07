/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Gallery' ),
	description: __( 'Display multiple images in a rich gallery.' ),
	icon,
	keywords: [ __( 'images' ), __( 'photos' ) ],
	supports: {
		align: true,
	},
	styles: [
		{ name: 'default', label: _x( 'Default', 'block style' ), isDefault: true },
		{ name: 'rounded-corners', label: _x( 'Rounded Corners', 'block style' ) },
	],
	transforms,
	edit,
	save,
	deprecated,
};
