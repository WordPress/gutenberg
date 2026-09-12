/**
 * Records which parts of a store's state a selector reads, so that a
 * subscriber can be woken only when one of those parts changes.
 *
 * State handed to selectors is wrapped in a proxy for the first few
 * levels. Reading a property or a Map entry records its path. Values
 * below the depth limit are returned as they are, and the read is
 * recorded as a dependency on that value's reference.
 */

const SEP = '\u0000';
const MAX_DEPTH = 3;
const ROOT = 'k:root';

export type PathsByStore = Map< string, string[] >;

interface Tracker {
	leaves: Map< string, Set< string > >;
	containers: Map< string, Set< string > >;
}

let current: Tracker | null = null;

const proxyToTarget = new WeakMap< object, object >();
const proxyInfo = new WeakMap< object, { storeName: string; path: string } >();
const proxyCache = new WeakMap< object, Map< string, object > >();

function addTo(
	map: Map< string, Set< string > >,
	storeName: string,
	path: string
) {
	let set = map.get( storeName );
	if ( ! set ) {
		set = new Set();
		map.set( storeName, set );
	}
	set.add( path );
}

function recordLeaf( storeName: string, path: string ) {
	if ( current ) {
		addTo( current.leaves, storeName, path );
	}
}

function recordContainer( storeName: string, path: string ) {
	if ( current ) {
		addTo( current.containers, storeName, path );
	}
}

function isPlainObject( value: unknown ): value is Record< string, unknown > {
	if ( typeof value !== 'object' || value === null ) {
		return false;
	}
	const proto = Object.getPrototypeOf( value );
	return proto === Object.prototype || proto === null;
}

function getCached(
	target: object,
	path: string,
	create: () => object
): object {
	let byPath = proxyCache.get( target );
	if ( ! byPath ) {
		byPath = new Map();
		proxyCache.set( target, byPath );
	}
	let proxy = byPath.get( path );
	if ( ! proxy ) {
		proxy = create();
		byPath.set( path, proxy );
		proxyToTarget.set( proxy, target );
	}
	return proxy;
}

function getCachedFor(
	target: object,
	storeName: string,
	path: string,
	create: () => object
): object {
	const proxy = getCached( target, path, create );
	if ( ! proxyInfo.has( proxy ) ) {
		proxyInfo.set( proxy, { storeName, path } );
	}
	return proxy;
}

function wrap(
	value: unknown,
	storeName: string,
	path: string,
	depth: number
): unknown {
	// A method on a state object answers from mutable internals, like the
	// undo manager. Its reference never changes, so depend on the whole
	// store instead.
	if ( typeof value === 'function' ) {
		recordLeaf( storeName, ROOT );
		return value;
	}
	if ( depth >= MAX_DEPTH ) {
		recordLeaf( storeName, path );
		return value;
	}
	if ( value instanceof Map ) {
		recordContainer( storeName, path );
		return getCachedFor( value, storeName, path, () =>
			createMapProxy( value, storeName, path, depth )
		);
	}
	if ( isPlainObject( value ) ) {
		recordContainer( storeName, path );
		return getCachedFor( value, storeName, path, () =>
			createObjectProxy( value, storeName, path, depth )
		);
	}
	recordLeaf( storeName, path );
	return value;
}

function createObjectProxy(
	target: Record< string, unknown >,
	storeName: string,
	path: string,
	depth: number
) {
	return new Proxy( target, {
		get( t, prop ) {
			if ( typeof prop === 'symbol' ) {
				return Reflect.get( t, prop );
			}
			return wrap(
				Reflect.get( t, prop ),
				storeName,
				path + SEP + 'k:' + prop,
				depth + 1
			);
		},
		has( t, prop ) {
			if ( typeof prop !== 'symbol' ) {
				recordLeaf( storeName, path + SEP + 'k:' + prop );
			}
			return Reflect.has( t, prop );
		},
		ownKeys( t ) {
			recordLeaf( storeName, path );
			return Reflect.ownKeys( t );
		},
		getOwnPropertyDescriptor( t, prop ) {
			recordLeaf( storeName, path );
			return Reflect.getOwnPropertyDescriptor( t, prop );
		},
	} );
}

const WHOLE_MAP_READS = new Set( [
	'size',
	'keys',
	'values',
	'entries',
	'forEach',
] );

function createMapProxy(
	target: Map< unknown, unknown >,
	storeName: string,
	path: string,
	depth: number
) {
	return new Proxy( target, {
		get( t, prop ) {
			if ( prop === 'get' ) {
				return ( key: unknown ) =>
					wrap(
						t.get( key ),
						storeName,
						path + SEP + 'm:' + String( key ),
						depth + 1
					);
			}
			if ( prop === 'has' ) {
				return ( key: unknown ) => {
					recordLeaf( storeName, path + SEP + 'm:' + String( key ) );
					return t.has( key );
				};
			}
			if (
				prop === Symbol.iterator ||
				WHOLE_MAP_READS.has( prop as string )
			) {
				recordLeaf( storeName, path );
				const value = Reflect.get( t, prop );
				return typeof value === 'function' ? value.bind( t ) : value;
			}
			const value = Reflect.get( t, prop );
			return typeof value === 'function' ? value.bind( t ) : value;
		},
	} );
}

/**
 * Returns the state's root wrapped for tracking while a `trackReads` call
 * is active, and the plain root otherwise.
 *
 * @param storeName Store the state belongs to.
 * @param root      The store's root state.
 */
export function trackRoot< T >( storeName: string, root: T ): T {
	if ( ! current ) {
		return root;
	}
	return wrap( root, storeName, ROOT, 0 ) as T;
}

/**
 * Records a dependency on the whole resolution metadata of a store.
 *
 * @param storeName Store name.
 */
export function trackMetadata( storeName: string ) {
	recordLeaf( storeName, 'k:metadata' );
}

/**
 * Returns the plain object behind a tracking proxy, or the value itself.
 *
 * @param value Possibly proxied value.
 */
export function toRaw< T >( value: T ): T {
	if ( typeof value === 'object' && value !== null ) {
		return ( proxyToTarget.get( value ) as T ) ?? value;
	}
	return value;
}

/**
 * Replaces a tracking proxy returned by a selector with the plain
 * object. The whole branch behind it becomes a dependency, since the
 * caller may read anything inside it later.
 *
 * @param value Selector result.
 */
export function untrack< T >( value: T ): T {
	if ( typeof value !== 'object' || value === null ) {
		return value;
	}
	const info = proxyInfo.get( value );
	if ( ! info ) {
		return value;
	}
	recordLeaf( info.storeName, info.path );
	return proxyToTarget.get( value ) as T;
}

/**
 * Runs `callback` while recording the state paths it reads through
 * bound selectors. Container reads are kept only when nothing below
 * them was read, which is the case when a selector returns a whole
 * branch of the state.
 *
 * @param callback Function to run.
 * @return The callback's result and the recorded paths per store.
 */
export function trackReads< T >( callback: () => T ): {
	result: T;
	paths: PathsByStore;
} {
	const previous = current;
	const tracker: Tracker = { leaves: new Map(), containers: new Map() };
	current = tracker;
	let result: T;
	try {
		result = callback();
	} finally {
		current = previous;
	}

	const paths: PathsByStore = new Map();
	const storeNames = new Set( [
		...tracker.leaves.keys(),
		...tracker.containers.keys(),
	] );
	for ( const storeName of storeNames ) {
		const leaves = tracker.leaves.get( storeName ) ?? new Set();
		const containers = tracker.containers.get( storeName ) ?? new Set();
		const all = [ ...leaves, ...containers ];
		const kept = new Set( leaves );
		for ( const container of containers ) {
			const prefix = container + SEP;
			const hasDescendant = all.some( ( p ) => p.startsWith( prefix ) );
			if ( ! hasDescendant ) {
				kept.add( container );
			}
		}
		paths.set( storeName, [ ...kept ] );
	}
	return { result, paths };
}

function step( value: unknown, segment: string ): unknown {
	if ( value === null || typeof value !== 'object' ) {
		return undefined;
	}
	const kind = segment[ 0 ];
	const key = segment.slice( 2 );
	if ( kind === 'm' ) {
		return value instanceof Map ? value.get( key ) : undefined;
	}
	return ( value as Record< string, unknown > )[ key ];
}

interface TrieNode {
	children: Map< string, TrieNode >;
	listeners: Set< () => void >;
}

interface Entry {
	deps: SubscriptionDeps | undefined;
	indexed: string[] | null | undefined;
	nodes: TrieNode[];
}

export interface SubscriptionDeps {
	paths: string[] | null;
}

function createNode(): TrieNode {
	return { children: new Map(), listeners: new Set() };
}

/**
 * Index of listeners by the state paths they depend on. One walk over
 * the old and new state finds every listener whose paths changed.
 */
export function createPathIndex() {
	const root = createNode();
	const entries = new Map< () => void, Entry >();

	function unindex( entry: Entry, listener: () => void ) {
		for ( const node of entry.nodes ) {
			node.listeners.delete( listener );
		}
		entry.nodes = [];
	}

	function index( entry: Entry, listener: () => void ) {
		const paths = entry.deps?.paths ?? null;
		if ( ! paths ) {
			root.listeners.add( listener );
			entry.nodes.push( root );
		} else {
			for ( const path of paths ) {
				let node = root;
				for ( const segment of path.split( SEP ) ) {
					let child = node.children.get( segment );
					if ( ! child ) {
						child = createNode();
						node.children.set( segment, child );
					}
					node = child;
				}
				node.listeners.add( listener );
				entry.nodes.push( node );
			}
		}
		entry.indexed = paths;
	}

	return {
		add( listener: () => void, deps?: SubscriptionDeps ) {
			const entry: Entry = { deps, indexed: undefined, nodes: [] };
			entries.set( listener, entry );
			index( entry, listener );
		},
		delete( listener: () => void ) {
			const entry = entries.get( listener );
			if ( entry ) {
				unindex( entry, listener );
				entries.delete( listener );
			}
		},
		/**
		 * Returns the listeners whose paths differ between the two states.
		 * Listeners whose recorded paths changed since the last walk are
		 * re-indexed first.
		 *
		 * @param oldState Previous state.
		 * @param newState Current state.
		 */
		collect( oldState: unknown, newState: unknown ): Set< () => void > {
			for ( const [ listener, entry ] of entries ) {
				const paths = entry.deps?.paths ?? null;
				if ( paths !== entry.indexed ) {
					unindex( entry, listener );
					index( entry, listener );
				}
			}
			const changed = new Set< () => void >();
			const walk = ( node: TrieNode, a: unknown, b: unknown ) => {
				if ( a === b ) {
					return;
				}
				for ( const listener of node.listeners ) {
					changed.add( listener );
				}
				for ( const [ segment, child ] of node.children ) {
					walk( child, step( a, segment ), step( b, segment ) );
				}
			};
			walk( root, oldState, newState );
			return changed;
		},
		get size() {
			return entries.size;
		},
	};
}
