/**
 * Internal dependencies
 */

function isList( node ) {
	return node.nodeName === 'OL' || node.nodeName === 'UL';
}

function createLineBreak( doc ) {
	return doc.createElement( 'br' );
}

function createBullet( doc, child, isNested ) {
	const node = doc.createElement( 'pre' );
	const isOrdered = child.parentElement.nodeName === 'OL';
	let bullet = '- ';

	if ( isOrdered ) {
		const index = Array.from( child.parentElement.childNodes )
			.filter( ( item ) => item.nodeName === 'LI' )
			.indexOf( child );
		bullet = `${ index + 1 }. `;
	}
	if ( isNested ) {
		bullet = `  ${ bullet }`;
	}
	node.innerText = bullet;
	return node;
}

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
