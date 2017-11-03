/**
 * External dependencies
 */
import { forEach } from 'lodash';

export function createSimpleNode( node, filter = Array ) {
	if ( ! node ) {
		return null;
	}

	if ( node.nodeType === 3 ) {
		return node.nodeValue;
	}

	if ( node.nodeType !== 1 ) {
		return null;
	}

	return filter(
		node.nodeName.toLowerCase(),
		Array.from( node.attributes || [] ).reduce( ( acc, { name, value } ) => ( {
			...acc,
			[ name ]: value,
		} ), {} ),
		...createSimpleNodeList( node.childNodes || [], filter )
	);
}

export function createSimpleNodeList( nodeList, filter ) {
	return Array.from( nodeList ).reduce( ( acc, node ) => {
		const child = createSimpleNode( node, filter );

		if ( Array.isArray( child ) && typeof child[ 0 ] !== 'string' ) {
			acc.push( ...child );
		} else if ( child ) {
			acc.push( child );
		}

		return acc;
	}, [] );
}

// Smarter application in the future?
export function applySimpleNodeList( tree, node ) {
	while ( node.firstChild ) {
		node.removeChild( node.firstChild );
	}

	forEach( tree, ( piece ) => {
		if ( typeof piece === 'string' ) {
			node.appendChild( document.createTextNode( piece ) );
		} else {
			const [ name, attributes, ...children ] = piece;
			const element = document.createElement( name );

			forEach( attributes, ( value, key ) => {
				element.setAttribute( key, value );
			} );

			applySimpleNodeList( children, element );

			node.appendChild( element );
		}
	} );
}

export function createHTMLFromSimpleNodeList( tree ) {
	const doc = document.implementation.createHTMLDocument( '' );

	applySimpleNodeList( tree, doc.body );

	return doc.body.innerHTML;
}
