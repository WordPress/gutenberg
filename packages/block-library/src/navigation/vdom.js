/**
 * External dependencies
 */
import { h } from 'preact';

// Convert DOM nodes to static virtual DOM nodes.
export const toVdom = ( node ) => {
	if ( node.nodeType === 3 ) return node.data;
	if ( node.nodeType === 8 ) return null;
	if ( node.localName === 'script' ) return h( 'script' );

	const props = {},
		a = node.attributes;

	for ( let i = 0; i < a.length; i++ ) {
		if ( a[ i ].name.startsWith( 'wp-' ) ) {
			props.wp = props.wp || {};
			let value = a[ i ].value;
			try {
				value = JSON.parse( value );
			} catch ( e ) {}
			props.wp[ renameDirective( a[ i ].name ) ] = value;
		} else {
			props[ a[ i ].name ] = a[ i ].value;
		}
	}

	return h(
		node.localName,
		props,
		[].map.call( node.childNodes, toVdom ).filter( exists )
	);
};

// Rename WordPress Directives from `wp-some-directive` to `someDirective`.
const renameDirective = ( s ) =>
	s
		.toLowerCase()
		.replace( /^wp-/, '' )
		.replace( /-(.)/g, ( _, chr ) => chr.toUpperCase() );

// Filter the truthy.
const exists = ( i ) => i;
