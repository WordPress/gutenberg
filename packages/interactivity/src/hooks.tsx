// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable react-hooks/exhaustive-deps */

/**
 * External dependencies
 */
import {
	h as createElement,
	options,
	createContext,
	cloneElement,
	type ComponentChildren,
} from 'preact';
import { useRef, useCallback, useContext } from 'preact/hooks';
import type { VNode, Context } from 'preact';

/**
 * Internal dependencies
 */
import { store, stores, universalUnlock } from './store';
import { warn } from './utils';
import { getScope, setScope, resetScope, type Scope } from './scopes';
export interface DirectiveEntry {
	value: string | object;
	namespace: string;
	suffix: string;
}

type DirectiveEntries = Record< string, DirectiveEntry[] >;

interface DirectiveArgs {
	/**
	 * Object map with the defined directives of the element being evaluated.
	 */
	directives: DirectiveEntries;
	/**
	 * Props present in the current element.
	 */
	props: { children?: ComponentChildren };
	/**
	 * Virtual node representing the element.
	 */
	element: VNode< {
		class?: string;
		style?: string | Record< string, string | number >;
		content?: ComponentChildren;
	} >;
	/**
	 * The inherited context.
	 */
	context: Context< any >;
	/**
	 * Function that resolves a given path to a value either in the store or the
	 * context.
	 */
	evaluate: Evaluate;
}

interface DirectiveCallback {
	( args: DirectiveArgs ): VNode< any > | null | void;
}

interface DirectiveOptions {
	/**
	 * Value that specifies the priority to evaluate directives of this type.
	 * Lower numbers correspond with earlier execution.
	 *
	 * @default 10
	 */
	priority?: number;
}

export interface Evaluate {
	( entry: DirectiveEntry, ...args: any[] ): any;
}

interface GetEvaluate {
	( args: { scope: Scope } ): Evaluate;
}

type PriorityLevel = string[];

interface GetPriorityLevels {
	( directives: DirectiveEntries ): PriorityLevel[];
}

interface DirectivesProps {
	directives: DirectiveEntries;
	priorityLevels: PriorityLevel[];
	element: VNode;
	originalProps: any;
	previousScope?: Scope;
}

// Main context.
const context = createContext< any >( {} );

// WordPress Directives.
const directiveCallbacks: Record< string, DirectiveCallback > = {};
const directivePriorities: Record< string, number > = {};

/**
 * Register a new directive type in the Interactivity API runtime.
 *
 * @example
 * ```js
 * directive(
 *   'alert', // Name without the `data-wp-` prefix.
 *   ( { directives: { alert }, element, evaluate } ) => {
 *     const defaultEntry = alert.find( entry => entry.suffix === 'default' );
 *     element.props.onclick = () => { alert( evaluate( defaultEntry ) ); }
 *   }
 * )
 * ```
 *
 * The previous code registers a custom directive type for displaying an alert
 * message whenever an element using it is clicked. The message text is obtained
 * from the store under the inherited namespace, using `evaluate`.
 *
 * When the HTML is processed by the Interactivity API, any element containing
 * the `data-wp-alert` directive will have the `onclick` event handler, e.g.,
 *
 * ```html
 * <div data-wp-interactive="messages">
 *   <button data-wp-alert="state.alert">Click me!</button>
 * </div>
 * ```
 * Note that, in the previous example, the directive callback gets the path
 * value (`state.alert`) from the directive entry with suffix `default`. A
 * custom suffix can also be specified by appending `--` to the directive
 * attribute, followed by the suffix, like in the following HTML snippet:
 *
 * ```html
 * <div data-wp-interactive="myblock">
 *   <button
 *     data-wp-color--text="state.text"
 *     data-wp-color--background="state.background"
 *   >Click me!</button>
 * </div>
 * ```
 *
 * This could be an hypothetical implementation of the custom directive used in
 * the snippet above.
 *
 * @example
 * ```js
 * directive(
 *   'color', // Name without prefix and suffix.
 *   ( { directives: { color: colors }, ref, evaluate } ) =>
 *     colors.forEach( ( color ) => {
 *       if ( color.suffix = 'text' ) {
 *         ref.style.setProperty(
 *           'color',
 *           evaluate( color.text )
 *         );
 *       }
 *       if ( color.suffix = 'background' ) {
 *         ref.style.setProperty(
 *           'background-color',
 *           evaluate( color.background )
 *         );
 *       }
 *     } );
 *   }
 * )
 * ```
 *
 * @param name             Directive name, without the `data-wp-` prefix.
 * @param callback         Function that runs the directive logic.
 * @param options          Options object.
 * @param options.priority Option to control the directive execution order. The
 *                         lesser, the highest priority. Default is `10`.
 */
export const directive = (
	name: string,
	callback: DirectiveCallback,
	{ priority = 10 }: DirectiveOptions = {}
) => {
	directiveCallbacks[ name ] = callback;
	directivePriorities[ name ] = priority;
};

// Resolve the path to some property of the store object.
const resolve = ( path: string, namespace: string ) => {
	if ( ! namespace ) {
		warn(
			`Namespace missing for "${ path }". The value for that path won't be resolved.`
		);
		return;
	}
	let resolvedStore = stores.get( namespace );
	if ( typeof resolvedStore === 'undefined' ) {
		resolvedStore = store( namespace, undefined, {
			lock: universalUnlock,
		} );
	}
	const current = {
		...resolvedStore,
		context: getScope().context[ namespace ],
	};
	try {
		// TODO: Support lazy/dynamically initialized stores
		return path.split( '.' ).reduce( ( acc, key ) => acc[ key ], current );
	} catch ( e ) {}
};

// Generate the evaluate function.
export const getEvaluate: GetEvaluate =
	( { scope } ) =>
	( entry, ...args ) => {
		let { value: path, namespace } = entry;
		if ( typeof path !== 'string' ) {
			throw new Error( 'The `value` prop should be a string path' );
		}
		// If path starts with !, remove it and save a flag.
		const hasNegationOperator =
			path[ 0 ] === '!' && !! ( path = path.slice( 1 ) );
		setScope( scope );
		const value = resolve( path, namespace );
		const result = typeof value === 'function' ? value( ...args ) : value;
		resetScope();
		return hasNegationOperator ? ! result : result;
	};

// Separate directives by priority. The resulting array contains objects
// of directives grouped by same priority, and sorted in ascending order.
const getPriorityLevels: GetPriorityLevels = ( directives ) => {
	const byPriority = Object.keys( directives ).reduce<
		Record< number, string[] >
	>( ( obj, name ) => {
		if ( directiveCallbacks[ name ] ) {
			const priority = directivePriorities[ name ];
			( obj[ priority ] = obj[ priority ] || [] ).push( name );
		}
		return obj;
	}, {} );

	return Object.entries( byPriority )
		.sort( ( [ p1 ], [ p2 ] ) => parseInt( p1 ) - parseInt( p2 ) )
		.map( ( [ , arr ] ) => arr );
};

// Component that wraps each priority level of directives of an element.
const Directives = ( {
	directives,
	priorityLevels: [ currentPriorityLevel, ...nextPriorityLevels ],
	element,
	originalProps,
	previousScope,
}: DirectivesProps ) => {
	// Initialize the scope of this element. These scopes are different per each
	// level because each level has a different context, but they share the same
	// element ref, state and props.
	const scope = useRef< Scope >( {} as Scope ).current;
	scope.evaluate = useCallback( getEvaluate( { scope } ), [] );
	scope.context = useContext( context );
	/* eslint-disable react-hooks/rules-of-hooks */
	scope.ref = previousScope?.ref || useRef( null );
	/* eslint-enable react-hooks/rules-of-hooks */

	// Create a fresh copy of the vnode element and add the props to the scope,
	// named as attributes (HTML Attributes).
	element = cloneElement( element, { ref: scope.ref } );
	scope.attributes = element.props;

	// Recursively render the wrapper for the next priority level.
	const children =
		nextPriorityLevels.length > 0
			? createElement( Directives, {
					directives,
					priorityLevels: nextPriorityLevels,
					element,
					originalProps,
					previousScope: scope,
			  } )
			: element;

	const props = { ...originalProps, children };
	const directiveArgs = {
		directives,
		props,
		element,
		context,
		evaluate: scope.evaluate,
	};

	setScope( scope );

	for ( const directiveName of currentPriorityLevel ) {
		const wrapper = directiveCallbacks[ directiveName ]?.( directiveArgs );
		if ( wrapper !== undefined ) {
			props.children = wrapper;
		}
	}

	resetScope();

	return props.children;
};

// Preact Options Hook called each time a vnode is created.
const old = options.vnode;
options.vnode = ( vnode: VNode< any > ) => {
	if ( vnode.props.__directives ) {
		const props = vnode.props;
		const directives = props.__directives;
		if ( directives.key ) {
			vnode.key = directives.key.find(
				( { suffix } ) => suffix === 'default'
			).value;
		}
		delete props.__directives;
		const priorityLevels = getPriorityLevels( directives );
		if ( priorityLevels.length > 0 ) {
			vnode.props = {
				directives,
				priorityLevels,
				originalProps: props,
				type: vnode.type,
				element: createElement( vnode.type as any, props ),
				top: true,
			};
			vnode.type = Directives;
		}
	}

	if ( old ) {
		old( vnode );
	}
};
