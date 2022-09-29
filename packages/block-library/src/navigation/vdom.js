/**
 * External dependencies
 */
import { h } from 'preact';

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
			let val = attributes[ i ].value;
			try {
				val = JSON.parse( val );
			} catch ( e ) {}
			wpDirectives[ rename( name ) ] = value( name, val );
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

// Rename WordPress Directives from:
// - `wp-some-directive` to `someDirective`.
// - `wp-some-prefix:some-directive` to `somePrefix`.
export const rename = ( name ) =>
	name
		.toLowerCase()
		.replace( /^wp-/, '' )
		.replace( /:.*/, '' )
		.replace( /-(.)/g, ( _, chr ) => chr.toUpperCase() );

// Add some support for suffixes and modifiers. See the tests file.
export const value = ( name, val ) => {
	if ( ! name.includes( ':' ) ) return val;
	return {
		name: rename( name ),
		suffix: name.substring( name.indexOf( ':' ) + 1 ),
		value: val,
	};
};
