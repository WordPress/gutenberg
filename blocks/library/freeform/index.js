/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import OldEditor from './old-editor';

export const name = 'core/freeform';

export const settings = {
	title: __( 'Classic' ),

	desription: __( 'The classic editor, in block form.' ),

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

	edit: OldEditor,

	save( { attributes } ) {
		const { content } = attributes;

		return <RawHTML>{ content }</RawHTML>;
	},
};
