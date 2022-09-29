/**
 * External dependencies
 */
import { h, options } from 'preact';

// WordPress Directives.
const directives = {};

// Expose function to add directives.
export const directive = ( name, cb ) => {
	directives[ name ] = cb;
};

const WpDirective = ( { type, wp, props: originalProps } ) => {
	const element = h( type, { ...originalProps, _wrapped: true } );
	const props = { ...originalProps, children: element };

	for ( const d in wp ) {
		const wrapper = directives[ d ]?.( wp, props, { element } );
		if ( wrapper !== undefined ) props.children = wrapper;
	}

	return props.children;
};

const old = options.vnode;
options.vnode = ( vnode ) => {
	const wp = vnode.props.wp;

	if ( wp ) {
		const props = vnode.props;
		delete props.wp;
		if ( ! props._wrapped ) {
			vnode.props = { type: vnode.type, wp, props };
			vnode.type = WpDirective;
		} else {
			delete props._wrapped;
		}
	}

	if ( old ) old( vnode );
};

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
		suffix: rename( name.substring( name.indexOf( ':' ) + 1 ) ),
		value: val,
	};
};
