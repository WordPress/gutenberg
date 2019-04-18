/**
 * WordPress dependencies
 */
import {
	createBlock,
	getBlockAttributes,
	getPhrasingContentSchema,
} from '@wordpress/blocks';
import {
	__UNSTABLE_LINE_SEPARATOR,
	create,
	join,
	replace,
	split,
	toHTMLString,
} from '@wordpress/rich-text';

const listContentSchema = {
	...getPhrasingContentSchema(),
	ul: {},
	ol: { attributes: [ 'type' ] },
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

const transforms = {
	from: [
		{
			type: 'block',
			isMultiBlock: true,
			blocks: [ 'core/paragraph' ],
			transform: ( blockAttributes ) => {
				return createBlock( 'core/list', {
					values: toHTMLString( {
						value: join( blockAttributes.map( ( { content } ) => {
							const value = create( { html: content } );

							if ( blockAttributes.length > 1 ) {
								return value;
							}

							// When converting only one block, transform
							// every line to a list item.
							return replace( value, /\n/g, __UNSTABLE_LINE_SEPARATOR );
						} ), __UNSTABLE_LINE_SEPARATOR ),
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
			schema: {
				ol: listContentSchema.ol,
				ul: listContentSchema.ul,
			},
			transform( node ) {
				return createBlock( 'core/list', {
					...getBlockAttributes(
						'core/list',
						node.outerHTML
					),
					ordered: node.nodeName === 'OL',
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
				split( create( {
					html: values,
					multilineTag: 'li',
					multilineWrapperTags: [ 'ul', 'ol' ],
				} ), __UNSTABLE_LINE_SEPARATOR )
					.map( ( piece ) =>
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
