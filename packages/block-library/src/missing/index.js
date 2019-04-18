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
	name,
	title: __( 'Unrecognized Block' ),
	description: __( 'Your site doesn’t include support for this block.' ),
	supports: {
		className: false,
		customClassName: false,
		inserter: false,
		html: false,
		reusable: false,
	},
	edit,
	save,
};
