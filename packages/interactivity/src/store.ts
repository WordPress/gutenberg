/**
 * Internal dependencies
 */
import { proxifyState, proxifyStore, deepMerge } from './proxies';
/**
 * External dependencies
 */
import { getNamespace } from './namespaces';
import { isPlainObject } from './utils';

export const stores = new Map();
const rawStores = new Map();
const storeLocks = new Map();
const storeConfigs = new Map();
const serverStates = new Map();

/**
 * Get the defined config for the store with the passed namespace.
 *
 * @param namespace Store's namespace from which to retrieve the config.
 * @return Defined config for the given namespace.
 */
export const getConfig = ( namespace?: string ) =>
	storeConfigs.get( namespace || getNamespace() ) || {};

/**
 * Get the part of the state defined and updated from the server.
 *
 * The object returned is read-only, and includes the state defined in PHP with
 * `wp_interactivity_state()`. When using `actions.navigate()`, this object is
 * updated to reflect the changes in its properites, without affecting the state
 * returned by `store()`. Directives can subscribe to those changes to update
 * the state if needed.
 *
 * @example
 * ```js
 *  const { state } = store('myStore', {
 *    callbacks: {
 *      updateServerState() {
 *        const serverState = getServerState();
 *        // Override some property with the new value that came from the server.
 *        state.overridableProp = serverState.overridableProp;
 *      },
 *    },
 *  });
 * ```
 *
 * @param namespace Store's namespace from which to retrieve the server state.
 * @return The server state for the given namespace.
 */
export const getServerState = ( namespace?: string ) => {
	const ns = namespace || getNamespace();
	if ( ! serverStates.has( ns ) ) {
		serverStates.set( ns, proxifyState( ns, {}, { readOnly: true } ) );
	}
	return serverStates.get( ns );
};

interface StoreOptions {
	/**
	 * Property to block/unblock private store namespaces.
	 *
	 * If the passed value is `true`, it blocks the given namespace, making it
	 * accessible only trough the returned variables of the `store()` call. In
	 * the case a lock string is passed, it also blocks the namespace, but can
	 * be unblocked for other `store()` calls using the same lock string.
	 *
	 * @example
	 * ```
	 * // The store can only be accessed where the `state` const can.
	 * const { state } = store( 'myblock/private', { ... }, { lock: true } );
	 * ```
	 *
	 * @example
	 * ```
	 * // Other modules knowing `SECRET_LOCK_STRING` can access the namespace.
	 * const { state } = store(
	 *   'myblock/private',
	 *   { ... },
	 *   { lock: 'SECRET_LOCK_STRING' }
	 * );
	 * ```
	 */
	lock?: boolean | string;
}

type Prettify< T > = { [ K in keyof T ]: T[ K ] } & {};
type DeepPartial< T > = T extends object
	? { [ P in keyof T ]?: DeepPartial< T[ P ] > }
	: T;
type DeepPartialState< T extends { state: object } > = Omit< T, 'state' > & {
	state?: DeepPartial< T[ 'state' ] >;
};
type ConvertGeneratorToPromise< T > = T extends (
	...args: infer A
) => Generator< any, infer R, any >
	? ( ...args: A ) => Promise< R >
	: never;
type ConvertGeneratorsToPromises< T > = {
	[ K in keyof T ]: T[ K ] extends ( ...args: any[] ) => any
		? ConvertGeneratorToPromise< T[ K ] > extends never
			? T[ K ]
			: ConvertGeneratorToPromise< T[ K ] >
		: T[ K ] extends object
		? Prettify< ConvertGeneratorsToPromises< T[ K ] > >
		: T[ K ];
};
type ConvertPromiseToGenerator< T > = T extends (
	...args: infer A
) => Promise< infer R >
	? ( ...args: A ) => Generator< any, R, any >
	: never;
type ConvertPromisesToGenerators< T > = {
	[ K in keyof T ]: T[ K ] extends ( ...args: any[] ) => any
		? ConvertPromiseToGenerator< T[ K ] > extends never
			? T[ K ]
			: ConvertPromiseToGenerator< T[ K ] >
		: T[ K ] extends object
		? Prettify< ConvertPromisesToGenerators< T[ K ] > >
		: T[ K ];
};

export const universalUnlock =
	'I acknowledge that using a private store means my plugin will inevitably break on the next store release.';

/**
 * Extends the Interactivity API global store adding the passed properties to
 * the given namespace. It also returns stable references to the namespace
 * content.
 *
 * These props typically consist of `state`, which is the reactive part of the
 * store ― which means that any directive referencing a state property will be
 * re-rendered anytime it changes ― and function properties like `actions` and
 * `callbacks`, mostly used for event handlers. These props can then be
 * referenced by any directive to make the HTML interactive.
 *
 * @example
 * ```js
 *  const { state } = store( 'counter', {
 *    state: {
 *      value: 0,
 *      get double() { return state.value * 2; },
 *    },
 *    actions: {
 *      increment() {
 *        state.value += 1;
 *      },
 *    },
 *  } );
 * ```
 *
 * The code from the example above allows blocks to subscribe and interact with
 * the store by using directives in the HTML, e.g.:
 *
 * ```html
 * <div data-wp-interactive="counter">
 *   <button
 *     data-wp-text="state.double"
 *     data-wp-on--click="actions.increment"
 *   >
 *     0
 *   </button>
 * </div>
 * ```
 * @param namespace The store namespace to interact with.
 * @param storePart Properties to add to the store namespace.
 * @param options   Options for the given namespace.
 *
 * @return A reference to the namespace content.
 */

// Overload for when the types are inferred.
export function store< T extends object >(
	namespace: string,
	storePart: T,
	options?: StoreOptions
): Prettify< ConvertGeneratorsToPromises< T > >;

// Overload for when types are passed via generics and they contain state.
export function store< T extends { state: object } >(
	namespace: string,
	storePart: ConvertPromisesToGenerators< DeepPartialState< T > >,
	options?: StoreOptions
): Prettify< ConvertGeneratorsToPromises< T > >;

// Overload for when types are passed via generics and they don't contain state.
export function store< T extends object >(
	namespace: string,
	storePart: ConvertPromisesToGenerators< T >,
	options?: StoreOptions
): Prettify< ConvertGeneratorsToPromises< T > >;

// Overload for when types are divided into multiple parts.
export function store< T extends object >(
	namespace: string,
	storePart: ConvertPromisesToGenerators< DeepPartial< T > >,
	options?: StoreOptions
): Prettify< ConvertGeneratorsToPromises< T > >;

export function store(
	namespace: string,
	{ state = {}, ...block }: any = {},
	{ lock = false }: StoreOptions = {}
) {
	if ( ! stores.has( namespace ) ) {
		// Lock the store if the passed lock is different from the universal
		// unlock. Once the lock is set (either false, true, or a given string),
		// it cannot change.
		if ( lock !== universalUnlock ) {
			storeLocks.set( namespace, lock );
		}
		const rawStore = {
			state: proxifyState(
				namespace,
				isPlainObject( state ) ? state : {}
			),
			...block,
		};
		const proxifiedStore = proxifyStore( namespace, rawStore );
		rawStores.set( namespace, rawStore );
		stores.set( namespace, proxifiedStore );
	} else {
		// Lock the store if it wasn't locked yet and the passed lock is
		// different from the universal unlock. If no lock is given, the store
		// will be public and won't accept any lock from now on.
		if ( lock !== universalUnlock && ! storeLocks.has( namespace ) ) {
			storeLocks.set( namespace, lock );
		} else {
			const storeLock = storeLocks.get( namespace );
			const isLockValid =
				lock === universalUnlock ||
				( lock !== true && lock === storeLock );

			if ( ! isLockValid ) {
				if ( ! storeLock ) {
					throw Error( 'Cannot lock a public store' );
				} else {
					throw Error(
						'Cannot unlock a private store with an invalid lock code'
					);
				}
			}
		}

		const target = rawStores.get( namespace );
		deepMerge( target, block );
		deepMerge( target.state, state );
	}

	return stores.get( namespace );
}

export const parseServerData = ( dom = document ) => {
	const jsonDataScriptTag =
		// Preferred Script Module data passing form
		dom.getElementById(
			'wp-script-module-data-@wordpress/interactivity'
		) ??
		// Legacy form
		dom.getElementById( 'wp-interactivity-data' );
	if ( jsonDataScriptTag?.textContent ) {
		try {
			return JSON.parse( jsonDataScriptTag.textContent );
		} catch {}
	}
	return {};
};

export const populateServerData = ( data?: {
	state?: Record< string, unknown >;
	config?: Record< string, unknown >;
} ) => {
	if ( isPlainObject( data?.state ) ) {
		Object.entries( data!.state ).forEach( ( [ namespace, state ] ) => {
			const st = store< any >( namespace, {}, { lock: universalUnlock } );
			deepMerge( st.state, state, false );
			deepMerge( getServerState( namespace ), state );
		} );
	}
	if ( isPlainObject( data?.config ) ) {
		Object.entries( data!.config ).forEach( ( [ namespace, config ] ) => {
			storeConfigs.set( namespace, config );
		} );
	}
};

// Parse and populate the initial state and config.
const data = parseServerData();
populateServerData( data );
