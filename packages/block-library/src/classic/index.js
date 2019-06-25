/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
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
		// Hide 'Add to Reusable Blocks' on Classic blocks. Showing it causes a
		// confusing UX, because of its similarity to the 'Convert to Blocks' button.
		reusable: false,
	},
	edit,
	save,
};
