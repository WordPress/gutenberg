/**
 * External dependencies
 */
import { useRef } from 'preact/hooks';
import { h, options } from 'preact';

// WordPress Directives.
const directives = {};

// Expose function to add directives.
export const directive = ( name, cb ) => {
	directives[ name ] = cb;
};

const WpDirective = ( { type, wp, props: originalProps } ) => {
	const ref = useRef( null );
	const element = h( type, { ...originalProps, ref, _wrapped: true } );
	const props = { ...originalProps, children: element };
	const directiveArgs = { directives: wp, props, element };

	for ( const d in wp ) {
		const wrapper = directives[ d ]?.( directiveArgs );
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
