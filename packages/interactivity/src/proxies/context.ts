/**
 * Internal dependencies
 */
import { isPlainObject } from '../utils';

// Assigned objects should be ignored during proxification.
const contextAssignedObjects = new WeakMap();

// Store the context proxy and fallback for each object in the context.
const contextObjectToProxy = new WeakMap();
const contextProxyToObject = new WeakMap();
const contextObjectToFallback = new WeakMap();

const descriptor = Reflect.getOwnPropertyDescriptor;

/**
 * Wrap a context object with a proxy to reproduce the context stack. The proxy
 * uses the passed `inherited` context as a fallback to look up for properties
 * that don't exist in the given context. Also, updated properties are modified
 * where they are defined, or added to the main context when they don't exist.
 *
 * By default, all plain objects inside the context are wrapped, unless it is
 * listed in the `ignore` option.
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
		const proxy = new Proxy( current, {
			get: ( target: object, k: string ) => {
				const fallback = contextObjectToFallback.get( current );
				// Always subscribe to prop changes in the current context.
				const currentProp = target[ k ];

				// Return the inherited prop when missing in target.
				if ( ! ( k in target ) && k in fallback ) {
					return fallback[ k ];
				}

				// Proxify plain objects that were not directly assigned.
				if (
					k in target &&
					! contextAssignedObjects.get( target )?.has( k ) &&
					isPlainObject( currentProp )
				) {
					return proxifyContext( currentProp );
				}

				// Return the stored proxy for `currentProp` when it exists.
				if ( contextObjectToProxy.has( currentProp ) ) {
					return contextObjectToProxy.get( currentProp );
				}

				/*
				 * For other cases, return the value from target, also
				 * subscribing to changes in the parent context when the current
				 * prop is not defined.
				 */
				return k in target ? currentProp : fallback[ k ];
			},
			set: ( target, k, value ) => {
				const fallback = contextObjectToFallback.get( current );
				const obj =
					k in target || ! ( k in fallback ) ? target : fallback;

				/*
				 * Assigned object values should not be proxified so they point
				 * to the original object and don't inherit unexpected
				 * properties.
				 */
				if ( value && typeof value === 'object' ) {
					if ( ! contextAssignedObjects.has( obj ) ) {
						contextAssignedObjects.set( obj, new Set() );
					}
					contextAssignedObjects.get( obj ).add( k );
				}

				/*
				 * When the value is a proxy, it's because it comes from the
				 * context, so the inner value is assigned instead.
				 */
				if ( contextProxyToObject.has( value ) ) {
					const innerValue = contextProxyToObject.get( value );
					obj[ k ] = innerValue;
				} else {
					obj[ k ] = value;
				}

				return true;
			},
			ownKeys: ( target ) => [
				...new Set( [
					...Object.keys( contextObjectToFallback.get( current ) ),
					...Object.keys( target ),
				] ),
			],
			getOwnPropertyDescriptor: ( target, k ) =>
				descriptor( target, k ) ||
				descriptor( contextObjectToFallback.get( current ), k ),
		} );
		contextObjectToProxy.set( current, proxy );
		contextProxyToObject.set( proxy, current );
	}
	return contextObjectToProxy.get( current );
};
