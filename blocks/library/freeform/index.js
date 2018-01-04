/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType, setUnknownTypeHandlerName } from '../../api';
import OldEditor from './old-editor';

registerBlockType( 'core/freeform', {
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

	edit: OldEditor,

	save( { attributes } ) {
		const { content } = attributes;
		return content;
	},
} );

setUnknownTypeHandlerName( 'core/freeform' );
