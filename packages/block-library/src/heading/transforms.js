/**
 * WordPress dependencies
 */
import { createBlock, getBlockAttributes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getLevelFromHeadingNodeName } from './shared';
import { getTransformedAttributes } from '../utils/get-transformed-attributes';

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) =>
				attributes.map( ( _attributes ) => {
					const { content, anchor, style } = _attributes;
					const textAlign = style?.typography?.textAlign;
					return createBlock( 'core/heading', {
						...getTransformedAttributes(
							_attributes,
							'core/heading',
							( { content: contentBinding } ) => ( {
								content: contentBinding,
							} )
						),
						content,
						anchor,
						...( textAlign && {
							style: {
								typography: {
									textAlign,
								},
							},
						} ),
					} );
				} ),
		},
		{
			type: 'raw',
			selector: 'h1,h2,h3,h4,h5,h6',
			schema: ( { phrasingContentSchema, isPaste } ) => {
				const schema = {
					children: phrasingContentSchema,
					attributes: isPaste ? [] : [ 'style', 'id' ],
				};
				return {
					h1: schema,
					h2: schema,
					h3: schema,
					h4: schema,
					h5: schema,
					h6: schema,
				};
			},
			transform( node ) {
				const attributes = getBlockAttributes(
					'core/heading',
					node.outerHTML
				);
				const { textAlign } = node.style || {};

				attributes.level = getLevelFromHeadingNodeName( node.nodeName );

				if (
					textAlign === 'left' ||
					textAlign === 'center' ||
					textAlign === 'right'
				) {
					attributes.style = {
						...attributes.style,
						typography: {
							...attributes.style?.typography,
							textAlign,
						},
					};
				}

				return createBlock( 'core/heading', attributes );
			},
		},
		...[ 1, 2, 3, 4, 5, 6 ].map( ( level ) => ( {
			type: 'prefix',
			prefix: Array( level + 1 ).join( '#' ),
			transform( content ) {
				return createBlock( 'core/heading', {
					level,
					content,
				} );
			},
		} ) ),
		...[ 1, 2, 3, 4, 5, 6 ].map( ( level ) => ( {
			type: 'enter',
			regExp: new RegExp( `^/(h|H)${ level }$` ),
			transform: () => createBlock( 'core/heading', { level } ),
		} ) ),
	],
	to: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/paragraph' ],
			transform: ( attributes ) =>
				attributes.map( ( _attributes ) => {
					const { content, style } = _attributes;
					const textAlign = style?.typography?.textAlign;
					return createBlock( 'core/paragraph', {
						...getTransformedAttributes(
							_attributes,
							'core/paragraph',
							( { content: contentBinding } ) => ( {
								content: contentBinding,
							} )
						),
						content,
						...( textAlign && {
							style: {
								typography: {
									textAlign,
								},
							},
						} ),
					} );
				} ),
		},
	],
};

export default transforms;
