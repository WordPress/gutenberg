import { toCanonical } from './attrs';

function camelCase( string ) {
	return string.toLowerCase().replace( /-([a-z])/g, ( match, $1 ) => $1.toUpperCase() );
}

export function styleStringToJSON( string = '' ) {
	return string.split( ';' ).reduce( ( accumulator, piece ) => {
		const pair = piece.split( ':' );
		const key = camelCase( pair[ 0 ] || '' ).trim();
		const value = ( pair[ 1 ] || '' ).trim();

		if ( key && value ) {
			accumulator[ key ] = value;
		}

		return accumulator;
	}, {} );
}

export function attributeListToReact( attributeList ) {
	return [ ...attributeList ].reduce( ( accumulator, { name, value } ) => {
		const key = toCanonical( name ) || name;

		if ( key === 'style' ) {
			value = styleStringToJSON( value );
		}

		accumulator[ key ] = value;

		return accumulator;
	}, {} );
}

let keyCounter = 0;

export function nodeListToReact( nodeList, createElement ) {
	return [ ...nodeList ].reduce( ( accumulator, node ) => {
		if ( ! node._domReactKey ) {
			node._domReactKey = '_domReact' + String( keyCounter++ );
		}

		const child = nodeToReact( node, createElement );

		if ( Array.isArray( child ) ) {
			accumulator.push( ...child );
		} else {
			accumulator.push( child );
		}

		return accumulator;
	}, [] );
}

export function nodeToReact( node, createElement ) {
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

	let props = {};
	let children = [];

	if ( node.hasAttributes() ) {
		props = attributeListToReact( node.attributes );
	}

	if ( node._domReactKey ) {
		props.key = node._domReactKey;
	}

	if ( node.hasChildNodes() ) {
		children = nodeListToReact( node.childNodes, createElement );
	}

	return createElement( type, props, ...children );
}

export { toCanonical };
