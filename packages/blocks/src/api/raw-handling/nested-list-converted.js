function isList( node ) {
	return node.nodeName === 'OL' || node.nodeName === 'UL';
}

function createLineBreak( doc ) {
	return doc.createElement( 'br' );
}

function getDepth( listNode, depth = 0 ) {
	if ( isList( listNode.parentElement ) ) {
		return getDepth( listNode.parentElement, depth + 1 );
	}
	return depth;
}

function createSpace( length ) {
	return (
		Array.from( { length } )
			// eslint-disable-next-line no-unused-vars
			.map( ( i ) => `\u00A0 \u00A0` )
			.join( '' )
	);
}

function createBullet( doc, child, isNested ) {
	const node = doc.createElement( 'span' );
	const isOrdered = child.parentElement.nodeName === 'OL';
	let bullet = '- ';

	if ( isOrdered ) {
		const index = Array.from( child.parentElement.childNodes )
			.filter( ( item ) => item.nodeName === 'LI' )
			.indexOf( child );
		bullet = `${ index + 1 }. `;
	}
	if ( isNested ) {
		const space = createSpace( getDepth( child.parentElement ) );

		bullet = `${ space }${ bullet }`;
	}
	node.innerText = bullet;
	return node;
}

/**
 * Converts OL and UL nodes into a P node that is formatted
 * with whitespace to maintain the old structure and position
 * of LI nodes, which allows us to support
 * pseudo lists in places where UL and OL are not
 * allowed, e.g. TD nodes.
 *
 * This allows us to maintain some level of support when lists
 * are copied from editors that do support lists in TD nodes, like
 * Google Docs.
 *
 * It supports nested lists.
 *
 * @param {Node}     node the node to convert
 * @param {Document} doc  the parent document.
 */
export default function nestedListedConverter( node, doc ) {
	function transformList( list, result = [] ) {
		const isNested = isList( node.parentElement );

		Array.from( list.childNodes ).forEach( ( child ) => {
			if ( child.nodeName === 'LI' ) {
				result.push( createLineBreak( doc ) );
				result.push( createBullet( doc, child, isNested ) );
				result = result.concat( Array.from( child.childNodes ) );
			} else {
				result.push( child );
			}
		} );
		return result;
	}

	if ( isList( node ) ) {
		const nodes = transformList( node );
		if ( nodes.length ) {
			const wrapper = doc.createElement( 'p' );
			nodes.forEach( ( child ) => {
				wrapper.appendChild( child );
			} );
			node.replaceWith( wrapper );
		}
	}
}
