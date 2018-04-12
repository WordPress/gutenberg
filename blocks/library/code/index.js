/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	createBlock,
	registerBlockType,
	PlainText,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './editor.scss';

registerBlockType( 'core/code', {
	title: __( 'Code' ),

	description: __( 'The code block maintains spaces and tabs, great for showing code snippets.' ),

	icon: 'editor-code',

	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: 'property',
			selector: 'code',
			property: 'textContent',
		},
	},

	supports: {
		html: false,
	},

	transforms: {
		from: [
			{
				type: 'pattern',
				trigger: 'enter',
				regExp: /^```$/,
				transform: () => createBlock( 'core/code' ),
			},
			{
				type: 'raw',
				isMatch: ( node ) => (
					node.nodeName === 'PRE' &&
					node.children.length === 1 &&
					node.firstChild.nodeName === 'CODE'
				),
			},
		],
	},

	edit( { attributes, setAttributes, className } ) {
		return (
			<div className={ className }>
				<PlainText
					value={ attributes.content }
					onChange={ ( content ) => setAttributes( { content } ) }
					placeholder={ __( 'Write code…' ) }
					aria-label={ __( 'Code' ) }
				/>
			</div>
		);
	},

	save( { attributes } ) {
		return <pre><code>{ attributes.content }</code></pre>;
	},
} );
