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
	for ( const d in props.wp ) {
		directives[ d ]?.( props );
	}
	props._wrapped = true;
	const { wp, tag, children, ...rest } = props;
	return h( tag, rest, children );
};

const old = options.vnode;

options.vnode = ( vnode ) => {
	const wp = vnode.props.wp;
	const wrapped = vnode.props._wrapped;

	if ( wp ) {
		if ( ! wrapped ) {
			vnode.props.tag = vnode.type;
			vnode.type = WpDirective;
		}
	} else if ( wrapped ) {
		delete vnode.props._wrapped;
	}

	if ( old ) old( vnode );
};
