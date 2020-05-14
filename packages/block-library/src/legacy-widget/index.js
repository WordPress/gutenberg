/**
 * WordPress dependencies
 */
import { widget as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Legacy Widget (Experimental)' ),
	description: __( 'Display a legacy widget.' ),
	icon,
	supports: {
		html: false,
		customClassName: false,
	},
	edit,
};
