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

const WpDirective = ( props ) => {
	const element = h( props.type, props );
	const directiveProps = { ...props, children: element, element };

	for ( const d in props.wp ) {
		const ret = directives[ d ]?.( directiveProps );
		if ( ret !== undefined ) directiveProps.children = ret;
	}

	return directiveProps.children;
};

const old = options.vnode;

options.vnode = ( vnode ) => {
	const wp = vnode.props.wp;
	const wrapped = vnode.props._wrapped;

	if ( wp ) {
		if ( ! wrapped ) {
			vnode.props.type = vnode.type;
			vnode.props._wrapped = true;
			vnode.type = WpDirective;
		}
	} else if ( wrapped ) {
		delete vnode.props._wrapped;
	}

	if ( old ) old( vnode );
};
