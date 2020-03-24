/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { classic as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: _x( 'Classic', 'block title' ),
	description: __( 'Use the classic WordPress editor.' ),
	icon,
	supports: {
		className: false,
		customClassName: false,
		// Hide 'Add to Reusable blocks' on Classic blocks. Showing it causes a
		// confusing UX, because of its similarity to the 'Convert to Blocks' button.
		reusable: false,
	},
	edit,
	save,
};
