/**
 * WordPress dependencies
 */
import { createBlock, getBlockAttributes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name } from './block.json';
import { getListContentSchema } from '../list/transforms';

const tableContentPasteSchema = ( { phrasingContentSchema } ) => ( {
	// lists are allowed on paste but will be transformed to simple content
	// by transformContent below.
	tr: {
		allowEmpty: true,
		children: {
			th: {
				allowEmpty: true,
				children: getListContentSchema( { phrasingContentSchema } ),
				attributes: [ 'scope', 'colspan' ],
			},
			td: {
				allowEmpty: true,
				children: getListContentSchema( { phrasingContentSchema } ),
				attributes: [ 'colspan' ],
			},
		},
	},
} );

const tablePasteSchema = ( args ) => ( {
	table: {
		children: {
			thead: {
				allowEmpty: true,
				children: tableContentPasteSchema( args ),
			},
			tfoot: {
				allowEmpty: true,
				children: tableContentPasteSchema( args ),
			},
			tbody: {
				allowEmpty: true,
				children: tableContentPasteSchema( args ),
			},
		},
	},
} );

const indent = ( depth ) => {
	return Array.from( { length: depth * 4 } )
		.map( () => ' ' )
		.join( '' );
};

const isList = ( node ) => {
	return node.tagName === 'UL' || node.tagName === 'OL';
};

const transformContent = ( cell ) => {
	// not available by default in node (jest) env so eslint complains.
	// eslint-disable-next-line no-undef
	const parser = new DOMParser();
	const document = parser.parseFromString( cell.content, 'text/html' );
	const result = [];
	const processDOMTree = ( node, listDepth = 0 ) => {
		if ( isList( node ) ) {
			if ( listDepth === 0 ) {
				result.push( '<br/>' );
			}
			Array.from( node.childNodes ).forEach(
				( listItem, listItemIndex ) => {
					const children = Array.from( listItem.childNodes );
					let simple = [];
					children.forEach( ( child ) => {
						if ( isList( child ) ) {
							const bullet =
								node.tagName === 'UL'
									? '-'
									: `${ listItemIndex + 1 }.`;
							if ( simple.length ) {
								result.push(
									`${ indent(
										listDepth
									) } ${ bullet } ${ simple.join( '' ) }<br/>`
								);
								simple = [];
							}
							processDOMTree( child, listDepth + 1 );
						} else {
							simple.push( child.outerHTML || child.textContent );
						}
					} );
					if ( simple.length ) {
						const bullet =
							node.tagName === 'UL'
								? '-'
								: `${ listItemIndex + 1 }.`;

						result.push(
							`${ indent(
								listDepth
							) } ${ bullet } ${ simple.join( '' ) }<br/>`
						);
						simple = [];
					}
				}
			);
		} else if ( node.nodeName === '#text' ) {
			result.push( node.textContent );
		} else {
			result.push( node.outerHTML );
		}
	};

	Array.from( document.body.childNodes ).forEach( ( node ) =>
		processDOMTree( node )
	);

	cell.content = result.join( '' );
};

const transformTableNode = ( node ) => {
	const attributes = getBlockAttributes( name, node.outerHTML );
	attributes.body.forEach( ( row ) => {
		row.cells.forEach( ( cell ) => {
			transformContent( cell );
		} );
	} );
	return createBlock( name, attributes );
};

const transforms = {
	from: [
		{
			type: 'raw',
			selector: 'table',
			schema: tablePasteSchema,
			transform: transformTableNode,
		},
	],
};

export default transforms;
