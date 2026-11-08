import { createBlock, getBlockAttributes } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { getLevelFromHeadingNodeName } from './shared';
import { getTransformedAttributes } from '../utils/get-transformed-attributes';

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/paragraph' ],
			// The level shortcuts are declared here as well as on the
			// variations, so that they reach a paragraph and not only a
			// heading. Both declarations describe the same shortcut, and only
			// one of them can apply to any given selection.
			shortcuts: [ 1, 2, 3, 4, 5, 6 ].map( ( level ) => ( {
				name: `core/block-editor/transform-to-heading-${ level }`,
				description: sprintf(
					/* translators: %d: heading level e.g: "1", "2", "3" */
					__( 'Transform the selected block into a heading %d.' ),
					level
				),
				keyCombination: {
					modifier: 'access',
					character: `${ level }`,
				},
				variationName: `h${ level }`,
			} ) ),
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
			shortcuts: [
				{
					name: 'core/block-editor/transform-heading-to-paragraph',
					description: __(
						'Transform the selected heading into a paragraph.'
					),
					keyCombination: {
						modifier: 'access',
						character: '0',
					},
					aliases: [
						{
							modifier: 'access',
							character: '7',
						},
					],
				},
			],
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
