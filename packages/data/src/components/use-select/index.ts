// useSelect is a low-level hook that intentionally breaks rules-of-hooks
// in its internal helpers (_useStaticSelect, _useMappingSelect) where
// hooks are called inside non-hook functions and conditionally dispatched.
/* eslint-disable react-hooks/rules-of-hooks */
import { createQueue } from '@wordpress/priority-queue';
import {
	useRef,
	useCallback,
	useMemo,
	useSyncExternalStore,
	useDebugValue,
} from '@wordpress/element';
import { isShallowEqual } from '@wordpress/is-shallow-equal';
import useRegistry from '../registry-provider/use-registry';
import useAsyncMode from '../async-mode-provider/use-async-mode';
import type {
	MapSelect,
	SelectFunction,
	StoreDescriptor,
	AnyConfig,
	UseSelectReturn,
	DataRegistry,
} from '../../types';

const renderQueue = createQueue();

function warnOnUnstableReference(
	a: Record< string, unknown >,
	b: Record< string, unknown >
): void {
	if ( ! a || ! b ) {
		return;
	}

	const keys =
		typeof a === 'object' && typeof b === 'object'
			? Object.keys( a ).filter( ( k ) => a[ k ] !== b[ k ] )
			: [];

	// eslint-disable-next-line no-console
	console.warn(
		'The `useSelect` hook returns different values when called with the same state and parameters.\n' +
			'This can lead to unnecessary re-renders and performance issues if not fixed.\n\n' +
			'Non-equal value keys: %s\n\n',
		keys.join( ', ' )
	);
}

interface StoreSubscriber {
	subscribe: ( listener: () => void, isAsync: boolean ) => () => void;
	updateStores: ( newStores: string[] ) => void;
}

interface DeferredListener {
	context: object;
	callback: VoidFunction;
}

interface DeferredBucket {
	listeners: Set< DeferredListener >;
	// `notifyTick` value of the last store update this bucket saw.
	lastNotified: number;
	unsubscribe: VoidFunction;
}

// Counts store updates seen by deferred buckets. A hook compares the tick of
// its last recompute against a bucket's `lastNotified` to know whether an
// update was still waiting for idle time when the subscription went away.
let notifyTick = 0;

const deferredBuckets = new WeakMap<
	DataRegistry,
	Map< string, DeferredBucket >
>();

/**
 * Subscribe an async-mode listener to a store without adding it to the
 * store's own listener list. All async listeners of one store in one registry
 * share a single real subscription whose only synchronous work is scheduling a
 * flush. The flush runs at idle time and queues each listener under its own
 * context, so the render queue keeps coalescing per hook instance and
 * time-slicing between instances.
 *
 * @param registry  Registry.
 * @param storeName Store name.
 * @param listener  Listener record.
 *
 * @return Unsubscribe function. Returns the tick of the last store update the
 *         bucket saw.
 */
function subscribeDeferred(
	registry: DataRegistry,
	storeName: string,
	listener: DeferredListener
): () => number {
	let buckets = deferredBuckets.get( registry );
	if ( ! buckets ) {
		buckets = new Map();
		deferredBuckets.set( registry, buckets );
	}

	let bucket = buckets.get( storeName );
	if ( ! bucket ) {
		const listeners = new Set< DeferredListener >();
		const flush = () => {
			for ( const { context, callback } of listeners ) {
				renderQueue.add( context, callback );
			}
		};
		bucket = {
			listeners,
			lastNotified: 0,
			unsubscribe: registry.subscribe( () => {
				bucket!.lastNotified = ++notifyTick;
				renderQueue.add( listeners, flush );
			}, storeName ),
		};
		buckets.set( storeName, bucket );
	}

	const { listeners } = bucket;
	listeners.add( listener );

	return () => {
		if ( listeners.delete( listener ) && listeners.size === 0 ) {
			buckets.delete( storeName );
			renderQueue.cancel( listeners );
			bucket.unsubscribe();
		}
		return bucket.lastNotified;
	};
}

function Store( registry: DataRegistry, suspense: boolean ) {
	const select = ( suspense
		? registry.suspendSelect
		: registry.select ) as unknown as SelectFunction;
	const queueContext = {};
	let lastMapSelect: MapSelect | undefined;
	let lastMapResult: unknown;
	let lastMapResultValid = false;
	let lastIsAsync: boolean | undefined;
	let subscriber: StoreSubscriber | undefined;
	let subscribeFn: ( ( listener: () => void ) => () => void ) | undefined;
	let didWarnUnstableReference: boolean | undefined;
	let subscribed = false;
	// `notifyTick` value when `lastMapResult` was last computed.
	let computedAt = 0;
	const storeStatesOnMount = new Map< string, unknown >();

	function getStoreState( name: string ): unknown {
		// If there's no store property (custom generic store), return an empty
		// object. When comparing the state, the empty objects will cause the
		// equality check to fail, setting `lastMapResultValid` to false.
		return registry.stores[ name ]?.store?.getState?.() ?? {};
	}

	const createSubscriber = ( stores: string[] ): StoreSubscriber => {
		// The set of stores the `subscribe` function is supposed to subscribe to. Here it is
		// initialized, and then the `updateStores` function can add new stores to it.
		const activeStores = [ ...stores ];

		// The `subscribe` function, which is passed to the `useSyncExternalStore` hook, could
		// be called multiple times to establish multiple subscriptions. That's why we need to
		// keep a set of active subscriptions;
		const activeSubscriptions = new Set< ( storeName: string ) => void >();

		function subscribe(
			listener: () => void,
			isAsync: boolean
		): () => void {
			// Maybe invalidate the value right after subscription was created.
			// React will call `getValue` after subscribing, to detect store
			// updates that happened in the interval between the `getValue` call
			// during render and creating the subscription, which is slightly
			// delayed. We need to ensure that this second `getValue` call will
			// compute a fresh value only if any of the store states have
			// changed in the meantime. Later subscriptions (mode switches)
			// are covered by the notification tick check on unsubscribe.
			if ( ! subscribed && lastMapResultValid ) {
				for ( const name of activeStores ) {
					if (
						storeStatesOnMount.get( name ) !== getStoreState( name )
					) {
						lastMapResultValid = false;
					}
				}
			}

			subscribed = true;
			storeStatesOnMount.clear();

			const onStoreChange = () => {
				// Invalidate the value on store update, so that a fresh value is computed.
				lastMapResultValid = false;
				listener();
			};

			const deferredListener: DeferredListener = {
				context: queueContext,
				callback: onStoreChange,
			};

			const unsubs: Array< () => number | void > = [];
			function subscribeStore( storeName: string ) {
				// A store that isn't registered anywhere yet gets a plain
				// per-hook subscription: `registry.subscribe` would fall back
				// to the registry-wide emitter, and a shared bucket must not
				// pin that fallback for later subscribers.
				if ( isAsync && registry.select( storeName ) !== undefined ) {
					unsubs.push(
						subscribeDeferred(
							registry,
							storeName,
							deferredListener
						)
					);
					return;
				}
				const onChange = isAsync
					? () => renderQueue.add( queueContext, onStoreChange )
					: onStoreChange;
				unsubs.push( registry.subscribe( onChange, storeName ) );
			}

			for ( const storeName of activeStores ) {
				subscribeStore( storeName );
			}

			activeSubscriptions.add( subscribeStore );

			return () => {
				activeSubscriptions.delete( subscribeStore );

				let pending = false;
				for ( const unsub of unsubs.values() ) {
					// The return value of the subscribe function could be undefined if the store is a custom generic store.
					const lastNotified = unsub?.();
					if (
						lastNotified !== undefined &&
						lastNotified > computedAt
					) {
						pending = true;
					}
				}
				// Cancel existing store updates that were already scheduled.
				if ( renderQueue.cancel( queueContext ) ) {
					pending = true;
				}

				// When the subscription is re-created after a mode switch, React
				// re-reads the value right after re-subscribing. An update that
				// was still waiting for idle time must not be lost with it.
				if ( pending ) {
					lastMapResultValid = false;
				}
			};
		}

		// Check if `newStores` contains some stores we're not subscribed to yet, and add them.
		function updateStores( newStores: string[] ) {
			for ( const newStore of newStores ) {
				if ( activeStores.includes( newStore ) ) {
					continue;
				}

				// New `subscribe` calls will subscribe to `newStore`, too.
				activeStores.push( newStore );

				// Add `newStore` to existing subscriptions.
				for ( const subscription of activeSubscriptions ) {
					subscription( newStore );
				}
			}
		}

		return { subscribe, updateStores };
	};

	return ( mapSelect: MapSelect, isAsync: boolean ) => {
		function updateValue(): void {
			// If the last value is valid, and the `mapSelect` callback hasn't changed,
			// then we can safely return the cached value. The value can change only on
			// store update, and in that case value will be invalidated by the listener.
			if ( lastMapResultValid && mapSelect === lastMapSelect ) {
				return;
			}

			const listeningStores = { current: null as string[] | null };
			const mapResult = registry.__unstableMarkListeningStores(
				() => mapSelect( select, registry ),
				listeningStores
			);

			if ( ( globalThis as any ).SCRIPT_DEBUG ) {
				if ( ! didWarnUnstableReference ) {
					const secondMapResult = mapSelect( select, registry );
					if ( ! isShallowEqual( mapResult, secondMapResult ) ) {
						warnOnUnstableReference( mapResult, secondMapResult );
						didWarnUnstableReference = true;
					}
				}
			}

			if ( ! subscribed ) {
				for ( const name of listeningStores.current! ) {
					storeStatesOnMount.set( name, getStoreState( name ) );
				}
			}
			if ( ! subscriber ) {
				subscriber = createSubscriber( listeningStores.current! );
			} else {
				subscriber.updateStores( listeningStores.current! );
			}
			computedAt = notifyTick;

			// If the new value is shallow-equal to the old one, keep the old one so
			// that we don't trigger unwanted updates that do a `===` check.
			if ( ! isShallowEqual( lastMapResult, mapResult ) ) {
				lastMapResult = mapResult;
			}
			lastMapSelect = mapSelect;
			lastMapResultValid = true;
		}

		function getValue() {
			// Update the value in case it's been invalidated or `mapSelect` has changed.
			updateValue();
			return lastMapResult;
		}

		// When transitioning from async to sync mode, cancel existing store updates
		// that have been scheduled, and invalidate the value so that it's freshly
		// computed. It might have been changed by the update we just cancelled.
		if ( lastIsAsync && ! isAsync ) {
			lastMapResultValid = false;
			renderQueue.cancel( queueContext );
		}

		updateValue();

		// The mode is fixed per subscription. A mode switch needs a new
		// `subscribe` identity so that `useSyncExternalStore` drops the old
		// subscription and creates one on the other tier.
		if ( ! subscribeFn || lastIsAsync !== isAsync ) {
			const { subscribe: subscribeToStores } = subscriber!;
			subscribeFn = ( listener ) =>
				subscribeToStores( listener, isAsync );
		}

		lastIsAsync = isAsync;

		// Return a pair of functions that can be passed to `useSyncExternalStore`.
		return { subscribe: subscribeFn, getValue };
	};
}

function _useStaticSelect( storeName: StoreDescriptor< AnyConfig > | string ) {
	return useRegistry().select( storeName );
}

function _useMappingSelect(
	suspense: boolean,
	mapSelect: MapSelect,
	deps: unknown[]
) {
	const registry = useRegistry();
	const isAsync = useAsyncMode();
	const store = useMemo(
		() => Store( registry, suspense ),
		[ registry, suspense ]
	);

	// These are "pass-through" dependencies from the parent hook,
	// and the parent should catch any hook rule violations.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const selector = useCallback( mapSelect, deps );
	const { subscribe, getValue } = store( selector, isAsync );
	const result = useSyncExternalStore( subscribe, getValue, getValue );
	useDebugValue( result );
	return result;
}

/**
 * Custom react hook for retrieving props from registered selectors.
 *
 * In general, this custom React hook follows the
 * [rules of hooks](https://react.dev/reference/rules/rules-of-hooks).
 *
 * @param mapSelect Function called on every state change. The returned value is
 *                  exposed to the component implementing this hook. The function
 *                  receives the `registry.select` method on the first argument
 *                  and the `registry` on the second argument.
 *                  When a store key is passed, all selectors for the store will be
 *                  returned. This is only meant for usage of these selectors in event
 *                  callbacks, not for data needed to create the element tree.
 * @param deps      If provided, this memoizes the mapSelect so the same `mapSelect` is
 *                  invoked on every state change unless the dependencies change.
 *
 * @example
 * ```js
 * import { useSelect } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * function HammerPriceDisplay( { currency } ) {
 *   const price = useSelect( ( select ) => {
 *     return select( myCustomStore ).getPrice( 'hammer', currency );
 *   }, [ currency ] );
 *   return new Intl.NumberFormat( 'en-US', {
 *     style: 'currency',
 *     currency,
 *   } ).format( price );
 * }
 *
 * // Rendered in the application:
 * // <HammerPriceDisplay currency="USD" />
 * ```
 *
 * In the above example, when `HammerPriceDisplay` is rendered into an
 * application, the price will be retrieved from the store state using the
 * `mapSelect` callback on `useSelect`. If the currency prop changes then
 * any price in the state for that currency is retrieved. If the currency prop
 * doesn't change and other props are passed in that do change, the price will
 * not change because the dependency is just the currency.
 *
 * When data is only used in an event callback, the data should not be retrieved
 * on render, so it may be useful to get the selectors function instead.
 *
 * **Don't use `useSelect` this way when calling the selectors in the render
 * function because your component won't re-render on a data change.**
 *
 * ```js
 * import { useSelect } from '@wordpress/data';
 * import { store as myCustomStore } from 'my-custom-store';
 *
 * function Paste( { children } ) {
 *   const { getSettings } = useSelect( myCustomStore );
 *   function onPaste() {
 *     // Do something with the settings.
 *     const settings = getSettings();
 *   }
 *   return <div onPaste={ onPaste }>{ children }</div>;
 * }
 * ```
 *
 * @return The selected data or store selectors.
 */
export default function useSelect<
	T extends MapSelect | StoreDescriptor< AnyConfig >,
>( mapSelect: T, deps?: unknown[] ): UseSelectReturn< T > {
	// On initial call, on mount, determine the mode of this `useSelect` call
	// and then never allow it to change on subsequent updates.
	const staticSelectMode = typeof mapSelect !== 'function';
	const staticSelectModeRef = useRef( staticSelectMode );

	if ( staticSelectMode !== staticSelectModeRef.current ) {
		const prevMode = staticSelectModeRef.current ? 'static' : 'mapping';
		const nextMode = staticSelectMode ? 'static' : 'mapping';
		throw new Error(
			`Switching useSelect from ${ prevMode } to ${ nextMode } is not allowed`
		);
	}

	// `staticSelectMode` is not allowed to change during the hook instance's,
	// lifetime, so the rules of hooks are not really violated.

	return (
		staticSelectMode
			? _useStaticSelect( mapSelect as StoreDescriptor< AnyConfig > )
			: _useMappingSelect( false, mapSelect as MapSelect, deps! )
	) as UseSelectReturn< T >;
}

/**
 * A variant of the `useSelect` hook that has the same API, but is a compatible
 * Suspense-enabled data source.
 *
 * @param mapSelect Function called on every state change. The
 *                  returned value is exposed to the component
 *                  using this hook. The function receives the
 *                  `registry.suspendSelect` method as the first
 *                  argument and the `registry` as the second one.
 * @param deps      A dependency array used to memoize the `mapSelect`
 *                  so that the same `mapSelect` is invoked on every
 *                  state change unless the dependencies change.
 *
 * @throws A suspense Promise that is thrown if any of the called
 * selectors is in an unresolved state.
 *
 * @return Data object returned by the `mapSelect` function.
 */
export function useSuspenseSelect< T extends MapSelect >(
	mapSelect: T,
	deps: unknown[]
): ReturnType< T > {
	return _useMappingSelect( true, mapSelect, deps ) as ReturnType< T >;
}
/* eslint-enable react-hooks/rules-of-hooks */
