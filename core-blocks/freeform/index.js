/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/freeform';

export const settings = {
	title: _x( 'Classic', 'block title' ),

	description: __( 'It’s the classic WordPress editor and it’s a block! Drop the editor right in.' ),

	icon: 'editor-kitchensink',

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
	},

	edit,

	save( { attributes } ) {
		const { content } = attributes;

		return <RawHTML>{ content }</RawHTML>;
	},
};
