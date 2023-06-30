/**
 * External dependencies
 */
import { h, options, createContext, cloneElement } from 'preact';
import { useRef, useCallback } from 'preact/hooks';
/**
 * Internal dependencies
 */
import { rawStore as store } from './store';

/** @typedef {import('preact').VNode} Element */
/** @typedef {typeof context} Context */
/** @typedef {ReturnType<typeof getEvaluate>} Evaluate */

/**
 * @typedef {Object} DirectiveCallbackParams Callback parameters.
 * @property {Object}   directives Object map with the defined directives of the element being evaluated.
 * @property {Object}   props      Props present in the current element.
 * @property {Element}  element    Virtual node representing the original element.
 * @property {Context}  context    The inherited context.
 * @property {Evaluate} evaluate   Function that resolves a given path to a value either in the store or the context.
 */

/**
 * @callback DirectiveCallback Callback that runs the directive logic.
 * @param {DirectiveCallbackParams} params Callback parameters.
 */

/**
 * @typedef DirectiveOptions Options object.
 * @property {number} [priority=10] Value that specifies the priority to
 *                                  evaluate directives of this type. Lower
 *                                  numbers correspond with earlier execution.
 *                                  Default is `10`.
 */

// Main context.
const context = createContext( {} );

// WordPress Directives.
const directiveCallbacks = {};
const directivePriorities = {};

/**
 * Register a new directive type in the Interactivity API runtime.
 *
 * @example
 * ```js
 * directive(
 *   'alert', // Name without the `data-wp-` prefix.
 *   ( { directives: { alert }, element, evaluate }) => {
 *     element.props.onClick = () => {
 *       alert( evaluate( alert.default ) );
 *     }
 *   }
 * )
 * ```
 *
 * The previous code register a custom directive type for displaying an alert
 * message whenever an element using it is clicked. The message text is obtained
 * from the store using `evaluate`.
 *
 * When the HTML is processed by the Interactivity API, any element containing
 * the `data-wp-alert` directive will have the `onClick` event handler, e.g.,
 *
 * ```html
 * <button data-wp-alert="state.messages.alert">Click me!</button>
 * ```
 *
 * @param {string}            name     Directive name, without the `data-wp-` prefix.
 * @param {DirectiveCallback} callback Function that runs the directive logic.
 * @param {DirectiveOptions=} options  Options object.
 */
export const directive = ( name, callback, { priority = 10 } = {} ) => {
	directiveCallbacks[ name ] = callback;
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
	const byPriority = Object.keys( directives ).reduce( ( obj, name ) => {
		if ( directiveCallbacks[ name ] ) {
			const priority = directivePriorities[ name ];
			( obj[ priority ] = obj[ priority ] || [] ).push( name );
		}
		return obj;
	}, {} );

	return Object.entries( byPriority )
		.sort( ( [ p1 ], [ p2 ] ) => p1 - p2 )
		.map( ( [ , arr ] ) => arr );
};

// Priority level wrapper.
const Directives = ( {
	directives,
	priorityLevels: [ currentPriorityLevel, ...nextPriorityLevels ],
	element,
	evaluate,
	originalProps,
	elemRef,
} ) => {
	// Initialize the DOM reference.
	// eslint-disable-next-line react-hooks/rules-of-hooks
	elemRef = elemRef || useRef( null );

	// Create a reference to the evaluate function using the DOM reference.
	// eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
	evaluate = evaluate || useCallback( getEvaluate( { ref: elemRef } ), [] );

	// Create a fresh copy of the vnode element.
	element = cloneElement( element, { ref: elemRef } );

	// Recursively render the wrapper for the next priority level.
	const children =
		nextPriorityLevels.length > 0 ? (
			<Directives
				directives={ directives }
				priorityLevels={ nextPriorityLevels }
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

	for ( const directiveName of currentPriorityLevel ) {
		const wrapper = directiveCallbacks[ directiveName ]?.( directiveArgs );
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
