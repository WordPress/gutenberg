/**
 * WordPress dependencies
 */
import { createBlock, getBlockContent } from '@wordpress/blocks';
import { create, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { getTransformedAttributes } from '../utils/get-transformed-attributes';
import { parseFencedCode } from './utils';

const transforms = {
	from: [
		{
			type: 'enter',
			regExp: /^```(?:[ \t]*[^\s`]+)?(?:[ \t]*(?:\r?\n|<br\s*\/?\s*>))?[ \t]*$/,
			transform: ( { content } ) => {
				const parsedFencedCode = parseFencedCode( content, {
					allowEndOfString: true,
				} );

				if ( parsedFencedCode ) {
					return createBlock( 'core/code', parsedFencedCode );
				}

				return createBlock( 'core/code' );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) => {
				const { content } = attributes;
				const parsedFencedCode = parseFencedCode( content, {
					allowEndOfString: true,
				} );
				if ( parsedFencedCode ) {
					return createBlock( 'core/code', {
						...attributes,
						...getTransformedAttributes( attributes, 'core/code' ),
						...parsedFencedCode,
					} );
				}
				return createBlock( 'core/code', {
					...attributes,
					...getTransformedAttributes( attributes, 'core/code' ),
					content,
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/html' ],
			__experimentalConvert( block ) {
				const { attributes } = block;
				return createBlock( 'core/code', {
					...attributes,
					...getTransformedAttributes( attributes, 'core/code' ),
					// The HTML is plain text (with plain line breaks), so
					// convert it to rich text.
					content: toHTMLString( {
						value: create( { text: getBlockContent( block ) } ),
					} ),
				} );
			},
		},
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'PRE' &&
				node.children.length === 1 &&
				node.firstChild.nodeName === 'CODE',
			transform: ( node ) => {
				const codeElement = node.firstChild;
				const className = codeElement.getAttribute( 'class' ) || '';
				const classNames = className.split( /\s+/ );
				const languageClass = classNames.find( ( token ) =>
					token.startsWith( 'language-' )
				);
				const language = languageClass
					? languageClass.slice( 'language-'.length )
					: '';

				return createBlock( 'core/code', {
					content: toHTMLString( {
						value: create( { html: codeElement.innerHTML } ),
					} ),
					language,
				} );
			},
			schema: {
				pre: {
					children: {
						code: {
							attributes: [ 'class' ],
							children: {
								'#text': {},
							},
						},
					},
				},
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) => {
				const { content } = attributes;
				return createBlock( 'core/paragraph', {
					...getTransformedAttributes( attributes, 'core/paragraph' ),
					content,
				} );
			},
		},
	],
};

export default transforms;
