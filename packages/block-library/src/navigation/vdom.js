/**
 * External dependencies
 */
import { h } from 'preact';
/**
 * Internal dependencies
 */
import { rename } from './directives';

// Recursive function that transfoms a DOM tree into vDOM.
export default function toVdom( node ) {
	const props = {};
	const attributes = node.attributes;
	const wpDirectives = { initialRef: node }; // Pass down original static node.
	let hasWpDirectives = false;

	if ( node.nodeType === 3 ) return node.data;
	if ( node.nodeType === 8 ) return null;
	if ( node.localName === 'script' ) return h( 'script' );

	for ( let i = 0; i < attributes.length; i++ ) {
		const name = attributes[ i ].name;
		if ( name.startsWith( 'wp-' ) ) {
			hasWpDirectives = true;
			let value = attributes[ i ].value;
			try {
				value = JSON.parse( value );
			} catch ( e ) {}
			wpDirectives[ rename( name ) ] = value;
		} else {
			props[ name ] = attributes[ i ].value;
		}
	}

	if ( hasWpDirectives ) props.wp = wpDirectives;

	// Walk child nodes and return vDOM children.
	const children = [].map.call( node.childNodes, toVdom ).filter( exists );

	return h( node.localName, props, children );
}

// Filter existing items.
const exists = ( x ) => x;
