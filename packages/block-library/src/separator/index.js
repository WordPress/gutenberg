/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Separator' ),
	description: __( 'Create a break between ideas or sections with a horizontal separator.' ),
	icon,
	keywords: [ __( 'horizontal-line' ), 'hr', __( 'divider' ) ],
	styles: [
		{ name: 'default', label: __( 'Default' ), isDefault: true },
		{ name: 'wide', label: __( 'Wide Line' ) },
		{ name: 'dots', label: __( 'Dots' ) },
	],
	transforms,
	edit,
	save,
};
