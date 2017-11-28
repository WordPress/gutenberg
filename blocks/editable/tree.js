import { createElement } from '@wordpress/element';
import { domreact } from '@wordpress/utils';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

function attributesToReact( attributes ) {
	const reactAttrs = {};

	attributes.forEach( ( { name, value } ) => {
		const canonicalKey = domreact.toCanonical( name );
		const key = canonicalKey ? canonicalKey : name;
		reactAttrs[ key ] = key === 'style' ? domreact.styleStringToJSON( value ) : value;
	} );

	return reactAttrs;
}

function elementToReact( node ) {
	const props = node.attributes ? attributesToReact( node.attributes ) : {};
	const children = node.firstChild ? childrenToReact( node ) : [];

	return createElement( node.name, props, ...children );
}

function nodeToReact( node ) {
	if ( ! node ) {
		return null;
	} else if ( node.type === ELEMENT_NODE ) {
		return elementToReact( node );
	} else if ( node.type === TEXT_NODE ) {
		return node.value;
	}

	return null;
}

export function childrenToReact( node ) {
	const children = [];

	for ( let child = node.firstChild; child; child = child.next ) {
		children.push( nodeToReact( child ) );
	}

	return children;
}
