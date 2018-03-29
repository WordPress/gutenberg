/**
 * External dependencies
 */
export { attr, prop, html, text, query } from 'hpq';

export function buildTree( type, attributes, ...children ) {
	children = children.map( ( child ) => {
		if ( 'boolean' === typeof child ) {
			child = null;
		}

		if ( null === child || undefined === child ) {
			child = '';
		} else if ( 'number' === typeof child ) {
			child = String( child );
		}

		if ( 'string' === typeof child ) {
			return child;
		}

		return buildTree( child );
	} );

	return [ type, attributes, children ];
}

export function nodeListToTree( nodeList, createElement ) {
	return [ ...nodeList ].map( ( node ) => nodeToTree( node, createElement ) );
}

export function elementAsArray( type, attributes, children ) {
	return [ type, attributes, children ];
}

export function nodeToTree( node, createElement = elementAsArray ) {
	if ( ! node ) {
		return null;
	}

	if ( node.nodeType === 3 ) {
		return node.nodeValue;
	}

	if ( node.nodeType !== 1 ) {
		return null;
	}

	const type = node.nodeName.toLowerCase();
	const attributes = [ ...node.attributes ].reduce( ( result, { name, value } ) => {
		result[ name ] = value;
		return result;
	}, {} );
	const children = nodeListToTree( node.childNodes );

	return createElement( type, attributes, children );
}

export const children = ( selector ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		if ( match ) {
			return nodeListToTree( match.childNodes );
		}

		return [];
	};
};

export const node = ( selector ) => {
	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		return nodeToTree( match );
	};
};
