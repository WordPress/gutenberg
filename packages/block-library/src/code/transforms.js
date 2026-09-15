import { createBlock, getBlockContent } from '@wordpress/blocks';
import { create, toHTMLString } from '@wordpress/rich-text';
import { getTransformedAttributes } from '../utils/get-transformed-attributes';

const transforms = {
	from: [
		{
			type: 'input',
			regExp: /^```$/,
			transform: () => createBlock( 'core/code' ),
		},
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) => {
				const { content } = attributes;
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
			// The declared selector cannot say that the <code> is the whole of
			// the <pre>: CSS has no way to require that the text around it is
			// blank. This isMatch counts element children the way the
			// declared `:only-child` does — indented markup keeps a
			// whitespace text node before the <code> — so both runtimes claim
			// the same markup, and a <pre> holding real text besides its
			// <code> falls through to Preformatted instead of dropping it.
			name: 'from-raw',
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'PRE' &&
				node.children.length === 1 &&
				node.firstElementChild.nodeName === 'CODE' &&
				! Array.from( node.childNodes ).some(
					( child ) =>
						child.nodeType === child.TEXT_NODE &&
						child.textContent.trim()
				),
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
