/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/freeform';

export const settings = {
	title: __( 'Classic' ),

	description: __( 'It’s the classic WordPress editor and it’s a block! Drop the editor right in.' ),

	icon: <svg version="1" width="24" height="24"><path fill="none" d="M0 0h24v24H0V0zm0 0h24v24H0V0z"/><g><path d="M20 7v10H4V7h16m0-2H4L2 7v10l2 2h16l2-2V7l-2-2z"/><path d="M11 8h2v2h-2zM11 11h2v2h-2zM8 8h2v2H8zM8 11h2v2H8zM5 11h2v2H5zM5 8h2v2H5zM8 14h8v2H8zM14 11h2v2h-2zM14 8h2v2h-2zM17 11h2v2h-2zM17 8h2v2h-2z"/></g></svg>,

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
