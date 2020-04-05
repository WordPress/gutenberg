/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import transforms from './transforms';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Buttons' ),
	description: __(
		'Prompt visitors to take action with a group of button-style links.'
	),
	icon,
	keywords: [ __( 'link' ) ],
	supports: {
		align: true,
		alignWide: false,
	},
	transforms,
	edit,
	save,
};
