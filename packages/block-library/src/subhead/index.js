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
	title: __( 'Subheading (deprecated)' ),
	description: __( 'This block is deprecated. Please use the Paragraph block instead.' ),
	icon,
	supports: {
		// Hide from inserter as this block is deprecated.
		inserter: false,
		multiple: false,
	},
	transforms,
	edit,
	save,
};
