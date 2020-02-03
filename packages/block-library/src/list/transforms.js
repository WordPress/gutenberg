/**
 * WordPress dependencies
 */
import { createBlock, getBlockAttributes } from '@wordpress/blocks';
import {
	__UNSTABLE_LINE_SEPARATOR,
	create,
	join,
	replace,
	split,
	toHTMLString,
} from '@wordpress/rich-text';

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
			blocks: [ 'core/paragraph' ],
			transform: ( blockAttributes ) => {
				return createBlock( 'core/list', {
					values: toHTMLString( {
						value: join(
							blockAttributes.map( ( { content } ) => {
								const value = create( { html: content } );

								if ( blockAttributes.length > 1 ) {
									return value;
								}

								// When converting only one block, transform
								// every line to a list item.
								return replace(
									value,
									/\n/g,
									__UNSTABLE_LINE_SEPARATOR
								);
							} ),
							__UNSTABLE_LINE_SEPARATOR
						),
						multilineTag: 'li',
					} ),
				} );
			},
		},
		{
			type: 'block',
			blocks: [ 'core/quote' ],
			transform: ( { value } ) => {
				return createBlock( 'core/list', {
					values: toHTMLString( {
						value: create( { html: value, multilineTag: 'p' } ),
						multilineTag: 'li',
					} ),
				} );
			},
		},
		{
			type: 'raw',
			selector: 'ol,ul',
			schema: ( args ) => ( {
				ol: getListContentSchema( args ).ol,
				ul: getListContentSchema( args ).ul,
			} ),
			transform( node ) {
				const attributes = {
					ordered: node.nodeName === 'OL',
				};

				if ( attributes.ordered ) {
					const type = node.getAttribute( 'type' );

					if ( type ) {
						attributes.type = type;
					}

					if ( node.getAttribute( 'reversed' ) !== null ) {
						attributes.reversed = true;
					}

					const start = parseInt( node.getAttribute( 'start' ), 10 );

					if (
						! isNaN( start ) &&
						// start=1 only makes sense if the list is reversed.
						( start !== 1 || attributes.reversed )
					) {
						attributes.start = start;
					}
				}

				return createBlock( 'core/list', {
					...getBlockAttributes( 'core/list', node.outerHTML ),
					...attributes,
				} );
			},
		},
		...[ '*', '-' ].map( ( prefix ) => ( {
			type: 'prefix',
			prefix,
			transform( content ) {
				return createBlock( 'core/list', {
					values: `<li>${ content }</li>`,
				} );
			},
		} ) ),
		...[ '1.', '1)' ].map( ( prefix ) => ( {
			type: 'prefix',
			prefix,
			transform( content ) {
				return createBlock( 'core/list', {
					ordered: true,
					values: `<li>${ content }</li>`,
				} );
			},
		} ) ),
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { values } ) =>
				split(
					create( {
						html: values,
						multilineTag: 'li',
						multilineWrapperTags: [ 'ul', 'ol' ],
					} ),
					__UNSTABLE_LINE_SEPARATOR
				).map( ( piece ) =>
					createBlock( 'core/paragraph', {
						content: toHTMLString( { value: piece } ),
					} )
				),
		},
		{
			type: 'block',
			blocks: [ 'core/quote' ],
			transform: ( { values } ) => {
				return createBlock( 'core/quote', {
					value: toHTMLString( {
						value: create( {
							html: values,
							multilineTag: 'li',
							multilineWrapperTags: [ 'ul', 'ol' ],
						} ),
						multilineTag: 'p',
					} ),
				} );
			},
		},
	],
};

export default transforms;
