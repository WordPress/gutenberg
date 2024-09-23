const contextObjectToProxy = new WeakMap();
const contextObjectToFallback = new WeakMap();
const contextProxies = new WeakSet();

const descriptor = Reflect.getOwnPropertyDescriptor;

// TODO: Use the proxy registry to avoid multiple proxies on the same object.
const contextHandlers: ProxyHandler< object > = {
	get: ( target, key ) => {
		const fallback = contextObjectToFallback.get( target );
		// Always subscribe to prop changes in the current context.
		const currentProp = target[ key ];

		/*
		 * Return the value from `target` if it exists, or from `fallback`
		 * otherwise. This way, in the case the property doesn't exist either in
		 * `target` or `fallback`, it also subscribes to changes in the parent
		 * context.
		 */
		return key in target ? currentProp : fallback[ key ];
	},
	set: ( target, key, value ) => {
		const fallback = contextObjectToFallback.get( target );

		// If the property exists in the current context, modify it. Otherwise,
		// add it to the current context.
		const obj = key in target || ! ( key in fallback ) ? target : fallback;
		obj[ key ] = value;

		return true;
	},
	ownKeys: ( target ) => [
		...new Set( [
			...Object.keys( contextObjectToFallback.get( target ) ),
			...Object.keys( target ),
		] ),
	],
	getOwnPropertyDescriptor: ( target, key ) =>
		descriptor( target, key ) ||
		descriptor( contextObjectToFallback.get( target ), key ),
};

/**
 * Wrap a context object with a proxy to reproduce the context stack. The proxy
 * uses the passed `inherited` context as a fallback to look up for properties
 * that don't exist in the given context. Also, updated properties are modified
 * where they are defined, or added to the main context when they don't exist.
 *
 * @param current   Current context.
 * @param inherited Inherited context, used as fallback.
 *
 * @return The wrapped context object.
 */
export const proxifyContext = (
	current: object,
	inherited: object = {}
): object => {
	if ( contextProxies.has( current ) ) {
		throw Error( 'This object cannot be proxified.' );
	}
	// Update the fallback object reference when it changes.
	contextObjectToFallback.set( current, inherited );
	if ( ! contextObjectToProxy.has( current ) ) {
		const proxy = new Proxy( current, contextHandlers );
		contextObjectToProxy.set( current, proxy );
		contextProxies.add( proxy );
	}
	return contextObjectToProxy.get( current );
};
