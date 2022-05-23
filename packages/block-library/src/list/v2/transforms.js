/**
 * WordPress dependencies
 */
import { createBlock, switchToBlockType } from '@wordpress/blocks';
import {
	__UNSTABLE_LINE_SEPARATOR,
	create,
	split,
	toHTMLString,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { createListBlockFromDOMElement } from './migrate';

function getListContentSchema( { phrasingContentSchema } ) {
	const listContentSchema = {
		...phrasingContentSchema,
		ul: {},
		ol: { attributes: [ 'type', 'start', 'reversed' ] },
	};

	// Recursion is needed.
	// Possible: ul > li > ul.
	// Impossible: ul > ul.
	[ 'ul', 'ol' ].forEach( ( tag ) => {
		listContentSchema[ tag ].children = {
			li: {
				children: listContentSchema,
			},
		};
	} );

	return listContentSchema;
}

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/paragraph', 'core/heading' ],
			transform: ( blockAttributes ) => {
				let childBlocks = [];
				if ( blockAttributes.length > 1 ) {
					childBlocks = blockAttributes.map( ( { content } ) => {
						return createBlock( 'core/list-item', { content } );
					} );
				} else if ( blockAttributes.length === 1 ) {
					const value = create( {
						html: blockAttributes[ 0 ].content,
					} );
					childBlocks = split( value, '\n' ).map( ( result ) => {
						return createBlock( 'core/list-item', {
							content: toHTMLString( { value: result } ),
						} );
					} );
				}
				return createBlock(
					'core/list',
					{
						anchor: blockAttributes.anchor,
					},
					childBlocks
				);
			},
		},
		{
			type: 'block',
			blocks: [ 'core/quote', 'core/pullquote' ],
			transform: ( { value, anchor } ) => {
				return createBlock(
					'core/list',
					{
						anchor,
					},
					split(
						create( { html: value, multilineTag: 'p' } ),
						__UNSTABLE_LINE_SEPARATOR
					).map( ( result ) => {
						return createBlock( 'core/list-item', {
							content: toHTMLString( { value: result } ),
						} );
					} )
				);
			},
		},
		...[ '*', '-' ].map( ( prefix ) => ( {
			type: 'prefix',
			prefix,
			transform( content ) {
				return createBlock( 'core/list', {}, [
					createBlock( 'core/list-item', { content } ),
				] );
			},
		} ) ),
		...[ '1.', '1)' ].map( ( prefix ) => ( {
			type: 'prefix',
			prefix,
			transform( content ) {
				return createBlock(
					'core/list',
					{
						ordered: true,
					},
					[ createBlock( 'core/list-item', { content } ) ]
				);
			},
		} ) ),
		{
			type: 'raw',
			selector: 'ol,ul',
			schema: ( args ) => ( {
				ol: getListContentSchema( args ).ol,
				ul: getListContentSchema( args ).ul,
			} ),
			transform: createListBlockFromDOMElement,
		},
	],
	to: [
		...[ 'core/paragraph', 'core/heading' ].map( ( block ) => ( {
			type: 'block',
			blocks: [ block ],
			transform: ( _attributes, childBlocks ) => {
				return childBlocks
					.filter( ( { name } ) => name === 'core/list-item' )
					.map( ( { attributes } ) =>
						createBlock( block, {
							content: attributes.content,
						} )
					);
			},
		} ) ),
		...[ 'core/quote', 'core/pullquote' ].map( ( block ) => ( {
			type: 'block',
			blocks: [ block ],
			transform: ( attributes, innerBlocks ) => {
				return switchToBlockType(
					switchToBlockType(
						createBlock( 'core/list', attributes, innerBlocks ),
						'core/paragraph'
					),
					block
				);
			},
		} ) ),
	],
};

export default transforms;
