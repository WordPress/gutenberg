/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, source, createBlock } from '../../api';

const { prop } = source;

registerBlockType( 'core/code', {
	title: __( 'Code' ),

	icon: 'editor-code',

	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: prop( 'code', 'textContent' ),
		},
	},

	transforms: {
		from: [
			{
				type: 'pattern',
				trigger: 'enter',
				regExp: /^```$/,
				transform: () => createBlock( 'core/code' ),
			},
		],
	},

	edit( { attributes, setAttributes, className } ) {
		return (
			<TextareaAutosize
				className={ className }
				value={ attributes.content }
				onChange={ ( event ) => setAttributes( { content: event.target.value } ) }
				placeholder={ __( 'Write code…' ) }
			/>
		);
	},

	save( { attributes } ) {
		return <pre><code>{ attributes.content }</code></pre>;
	},
} );
