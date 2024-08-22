// TODO: Use the proxy registry to avoid multiple proxies on the same object.

// Store the context proxy and fallback for each object in the context.
const contextObjectToProxy = new WeakMap();
const contextProxyToObject = new WeakMap();
const contextObjectToFallback = new WeakMap();

const descriptor = Reflect.getOwnPropertyDescriptor;

const contextHandlers: ProxyHandler< object > = {
	get: ( target: object, k: string ) => {
		const fallback = contextObjectToFallback.get( target );
		// Always subscribe to prop changes in the current context.
		const currentProp = target[ k ];

		// Return the inherited prop when missing in target.
		if ( ! ( k in target ) && k in fallback ) {
			return fallback[ k ];
		}

		/*
		 * For other cases, return the value from target, also
		 * subscribing to changes in the parent context when the current
		 * prop is not defined.
		 */
		return k in target ? currentProp : fallback[ k ];
	},
	set: ( target, k, value ) => {
		const fallback = contextObjectToFallback.get( target );
		const obj = k in target || ! ( k in fallback ) ? target : fallback;
		obj[ k ] = value;

		return true;
	},
	ownKeys: ( target ) => [
		...new Set( [
			...Object.keys( contextObjectToFallback.get( target ) ),
			...Object.keys( target ),
		] ),
	],
	getOwnPropertyDescriptor: ( target, k ) =>
		descriptor( target, k ) ||
		descriptor( contextObjectToFallback.get( target ), k ),
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
	// Update the fallback object reference when it changes.
	contextObjectToFallback.set( current, inherited );
	if ( ! contextObjectToProxy.has( current ) ) {
		const proxy = new Proxy( current, contextHandlers );
		contextObjectToProxy.set( current, proxy );
		contextProxyToObject.set( proxy, current );
	}
	return contextObjectToProxy.get( current );
};
