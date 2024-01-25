/* @jsx createElement */

/**
 * External dependencies
 */
import {
	h as createElement,
	options,
	createContext,
	cloneElement,
} from 'preact';
import { useRef, useCallback, useContext } from 'preact/hooks';
import type { VNode, Context, RefObject } from 'preact';

/**
 * Internal dependencies
 */
import { stores } from './store';
interface DirectiveEntry {
	value: string | Object;
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
	props: Object;
	/**
	 * Virtual node representing the element.
	 */
	element: VNode;
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
	( args: DirectiveArgs ): VNode | void;
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

interface Scope {
	evaluate: Evaluate;
	context: Context< any >;
	ref: RefObject< HTMLElement >;
	attributes: createElement.JSX.HTMLAttributes;
}

interface Evaluate {
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

// Wrap the element props to prevent modifications.
const immutableMap = new WeakMap();
const immutableError = () => {
	throw new Error(
		'Please use `data-wp-bind` to modify the attributes of an element.'
	);
};
const immutableHandlers = {
	get( target, key, receiver ) {
		const value = Reflect.get( target, key, receiver );
		return !! value && typeof value === 'object'
			? deepImmutable( value )
			: value;
	},
	set: immutableError,
	deleteProperty: immutableError,
};
const deepImmutable = < T extends Object = {} >( target: T ): T => {
	if ( ! immutableMap.has( target ) )
		immutableMap.set( target, new Proxy( target, immutableHandlers ) );
	return immutableMap.get( target );
};

// Store stacks for the current scope and the default namespaces and export APIs
// to interact with them.
const scopeStack: Scope[] = [];
const namespaceStack: string[] = [];

/**
 * Retrieves the context inherited by the element evaluating a function from the
 * store. The returned value depends on the element and the namespace where the
 * function calling `getContext()` exists.
 *
 * @param namespace Store namespace. By default, the namespace where the calling
 *                  function exists is used.
 * @return The context content.
 */
export const getContext = < T extends object >( namespace?: string ): T =>
	getScope()?.context[ namespace || namespaceStack.slice( -1 )[ 0 ] ];

/**
 * Retrieves a representation of the element where a function from the store
 * is being evalutated. Such representation is read-only, and contains a
 * reference to the DOM element, its props and a local reactive state.
 *
 * @return Element representation.
 */
export const getElement = () => {
	if ( ! getScope() ) {
		throw Error(
			'Cannot call `getElement()` outside getters and actions used by directives.'
		);
	}
	const { ref, attributes } = getScope();
	return Object.freeze( {
		ref: ref.current,
		attributes: deepImmutable( attributes ),
	} );
};

export const getScope = () => scopeStack.slice( -1 )[ 0 ];

export const setScope = ( scope: Scope ) => {
	scopeStack.push( scope );
};
export const resetScope = () => {
	scopeStack.pop();
};

export const getNamespace = () => namespaceStack.slice( -1 )[ 0 ];

export const setNamespace = ( namespace: string ) => {
	namespaceStack.push( namespace );
};
export const resetNamespace = () => {
	namespaceStack.pop();
};

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
 * <div data-wp-interactive='{ "namespace": "messages" }'>
 *   <button data-wp-alert="state.alert">Click me!</button>
 * </div>
 * ```
 * Note that, in the previous example, the directive callback gets the path
 * value (`state.alert`) from the directive entry with suffix `default`. A
 * custom suffix can also be specified by appending `--` to the directive
 * attribute, followed by the suffix, like in the following HTML snippet:
 *
 * ```html
 * <div data-wp-interactive='{ "namespace": "myblock" }'>
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
 *   ( { directives: { color }, ref, evaluate } ) =>
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
const resolve = ( path, namespace ) => {
	let current = {
		...stores.get( namespace ),
		context: getScope().context[ namespace ],
	};
	path.split( '.' ).forEach( ( p ) => ( current = current[ p ] ) );
	return current;
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
		nextPriorityLevels.length > 0 ? (
			<Directives
				directives={ directives }
				priorityLevels={ nextPriorityLevels }
				element={ element }
				originalProps={ originalProps }
				previousScope={ scope }
			/>
		) : (
			element
		);

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
		if ( wrapper !== undefined ) props.children = wrapper;
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
		if ( directives.key )
			vnode.key = directives.key.find(
				( { suffix } ) => suffix === 'default'
			).value;
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

	if ( old ) old( vnode );
};
