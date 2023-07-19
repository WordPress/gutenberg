/**
 * External dependencies
 */
import { h, options, createContext, cloneElement } from 'preact';
import { useRef, useCallback } from 'preact/hooks';
/**
 * Internal dependencies
 */
import { rawStore as store } from './store';

// Main context.
const context = createContext( {} );

// WordPress Directives.
const directiveCallbacks = {};
const directivePriorities = {};
export const directive = ( name, cb, { priority = 10 } = {} ) => {
	directiveCallbacks[ name ] = cb;
	directivePriorities[ name ] = priority;
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

// Separate directives by priority. The resulting array contains objects
// of directives grouped by same priority, and sorted in ascending order.
const getPriorityLevels = ( directives ) => {
	const byPriority = Object.entries( directives ).reduce(
		( acc, [ name, values ] ) => {
			if ( directiveCallbacks[ name ] ) {
				const priority = directivePriorities[ name ];
				if ( ! acc[ priority ] ) acc[ priority ] = {};
				acc[ priority ][ name ] = values;
			}
			return acc;
		},
		{}
	);

	return Object.entries( byPriority )
		.sort( ( [ p1 ], [ p2 ] ) => p1 - p2 )
		.map( ( [ , obj ] ) => obj );
};

// Priority level wrapper.
const Directives = ( {
	directives,
	priorityLevels: [ thisPriorityLevel, ...restPriorityLevels ],
	element,
	evaluate,
	originalProps,
	elemRef,
} ) => {
	// eslint-disable-next-line react-hooks/rules-of-hooks
	elemRef = elemRef || useRef( null );
	// eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
	evaluate = evaluate || useCallback( getEvaluate( { ref: elemRef } ), [] );
	// Create a fresh copy of the vnode element.
	element = cloneElement( element, { ref: elemRef } );

	// Recursively render the wrapper for the next priority level.
	const children =
		restPriorityLevels.length > 0 ? (
			<Directives
				directives={ directives }
				priorityLevels={ restPriorityLevels }
				element={ element }
				evaluate={ evaluate }
				originalProps={ originalProps }
				elemRef={ elemRef }
			/>
		) : (
			element
		);

	const props = { ...originalProps, children };
	const directiveArgs = { directives, props, element, context, evaluate };

	for ( const d in thisPriorityLevel ) {
		const wrapper = directiveCallbacks[ d ]?.( directiveArgs );
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
		const priorityLevels = getPriorityLevels( directives );
		if ( priorityLevels.length > 0 ) {
			vnode.props = {
				directives,
				priorityLevels,
				originalProps: props,
				type: vnode.type,
				element: h( vnode.type, props ),
				top: true,
			};
			vnode.type = Directives;
		}
	}

	if ( old ) old( vnode );
};
