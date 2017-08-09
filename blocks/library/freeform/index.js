/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, source, setUnknownTypeHandlerName } from '../../api';
import OldEditor from './old-editor';

const { prop } = source;

registerBlockType( 'core/freeform', {
	title: __( 'Classic Text' ),

	icon: 'editor-kitchensink',

	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: prop( 'innerHTML' ),
		},
	},

	edit: OldEditor,

	save( { attributes } ) {
		const { content } = attributes;
		return content;
	},
} );

setUnknownTypeHandlerName( 'core/freeform' );
