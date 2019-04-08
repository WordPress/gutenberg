/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'core/freeform';

export const settings = {
	title: _x( 'Classic', 'block title' ),

	description: __( 'Use the classic WordPress editor.' ),

	icon,

	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: 'html',
		},
	},

	supports: {
		className: false,
		customClassName: false,
		// Hide 'Add to Reusable Blocks' on Classic blocks. Showing it causes a
		// confusing UX, because of its similarity to the 'Convert to Blocks' button.
		reusable: false,
	},

	edit,

	save( { attributes } ) {
		const { content } = attributes;

		return <RawHTML>{ content }</RawHTML>;
	},
};
