/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from '../button/icon';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Buttons' ),
	description: __( 'Create a block of buttons' ),
	icon,
	keywords: [ __( 'link' ) ],
	supports: {
		align: true,
		alignWide: false,
	},
	styles: [
		{ name: 'fill', label: __( 'Fill' ), isDefault: true },
		{ name: 'outline', label: __( 'Outline' ) },
	],
	edit,
	save,
};
