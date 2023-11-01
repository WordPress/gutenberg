/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { create, split, toHTMLString } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { createListBlockFromDOMElement } from './utils';

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

function getListContentFlat( blocks ) {
	return blocks.flatMap( ( { name, attributes, innerBlocks = [] } ) => {
		if ( name === 'core/list-item' ) {
			return [ attributes.content, ...getListContentFlat( innerBlocks ) ];
		}
		return getListContentFlat( innerBlocks );
	} );
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
			type: 'raw',
			selector: 'ol,ul',
			schema: ( args ) => ( {
				ol: getListContentSchema( args ).ol,
				ul: getListContentSchema( args ).ul,
			} ),
			transform: createListBlockFromDOMElement,
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
	],
	to: [
		...[ 'core/paragraph', 'core/heading' ].map( ( block ) => ( {
			type: 'block',
			blocks: [ block ],
			transform: ( _attributes, childBlocks ) => {
				return getListContentFlat( childBlocks ).map( ( content ) =>
					createBlock( block, {
						content,
					} )
				);
			},
		} ) ),
	],
};

export default transforms;
