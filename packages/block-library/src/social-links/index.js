/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Social links' ),
	icon: 'share',
	description: __( 'Create a block of links to your social media or external sites' ),
	styles: [
		{ name: 'default', label: __( 'Default' ), isDefault: true },
		{ name: 'logos-only', label: __( 'Logos Only' ) },
		{ name: 'pill-shape', label: __( 'Pill Shape' ) },
	],
	edit,
	save,
};
