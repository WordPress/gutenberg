/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';

const { prop } = query;

registerBlockType( 'core/code', {
	title: __( 'Code' ),

	icon: 'editor-code',

	category: 'formatting',

	attributes: {
		content: prop( 'code', 'textContent' ),
	},

	edit( { attributes, setAttributes } ) {
		return (
			<TextareaAutosize
				value={ attributes.content }
				onChange={ ( event ) => setAttributes( { content: event.target.value } ) }
			/>
		);
	},

	save( { attributes } ) {
		return <pre><code>{ attributes.content }</code></pre>;
	},
} );
