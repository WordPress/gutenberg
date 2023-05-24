/**
 * External dependencies
 */
import { h, options, createContext } from 'preact';
import { useRef, useMemo } from 'preact/hooks';
/**
 * Internal dependencies
 */
import { rawStore as store } from './store';

// Main context.
const context = createContext( {} );

// WordPress Directives.
const directiveMap = {};
export const directive = ( name, cb ) => {
	directiveMap[ name ] = cb;
};

// Resolve the path to some property of the store object.
const resolve = ( path, ctx ) => {
	let current = { ...store, context: ctx };
	path.split( '.' ).forEach( ( p ) => ( current = current[ p ] ) );
	return current;
};

// Generate the evaluate function.
const getEvaluate =
	( { ref } = {} ) =>
	( path, extraArgs = {} ) => {
		// If path starts with !, remove it and save a flag.
		const hasNegationOperator =
			path[ 0 ] === '!' && !! ( path = path.slice( 1 ) );
		const value = resolve( path, extraArgs.context );
		const returnValue =
			typeof value === 'function'
				? value( {
						ref: ref.current,
						...store,
						...extraArgs,
				  } )
				: value;
		return hasNegationOperator ? ! returnValue : returnValue;
	};

// Directive wrapper.
const Directive = ( { type, directives, props: originalProps } ) => {
	const ref = useRef( null );
	const element = h( type, { ...originalProps, ref } );
	const props = { ...originalProps, children: element };
	const evaluate = useMemo( () => getEvaluate( { ref } ), [] );
	const directiveArgs = { directives, props, element, context, evaluate };

	for ( const d in directives ) {
		const wrapper = directiveMap[ d ]?.( directiveArgs );
		if ( wrapper !== undefined ) props.children = wrapper;
	}

	return props.children;
};

// Preact Options Hook called each time a vnode is created.
const old = options.vnode;
options.vnode = ( vnode ) => {
	if ( vnode.props.__directives ) {
		const props = vnode.props;
		const directives = props.__directives;
		delete props.__directives;
		vnode.props = {
			type: vnode.type,
			directives,
			props,
		};
		vnode.type = Directive;
	}

	if ( old ) old( vnode );
};
