/**
 * External dependencies
 */
import { h } from 'preact';

// Recursive function that transfoms a DOM tree into vDOM.
export default function toVdom( node ) {
	const props = {};
	const attributes = node.attributes;
	const wpDirectives = {};
	let hasWpDirectives = false;

	if ( node.nodeType === 3 ) return node.data;
	if ( node.nodeType === 8 ) return null;
	if ( node.localName === 'script' ) return h( 'script' );

	for ( let i = 0; i < attributes.length; i++ ) {
		const name = attributes[ i ].name;
		if ( name.startsWith( 'wp-' ) ) {
			hasWpDirectives = true;
			let val = attributes[ i ].value;
			try {
				val = JSON.parse( val );
			} catch ( e ) {}
			const [ , prefix, suffix ] = /wp-([^:]+):?(.*)$/.exec( name );
			wpDirectives[ prefix ] = wpDirectives[ prefix ] || {};
			wpDirectives[ prefix ][ suffix || 'default' ] = val;
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
