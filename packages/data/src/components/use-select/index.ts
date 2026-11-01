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

interface DeferredListener {
	context: object;
	callback: VoidFunction;
}

// A subscription is also its own deferred listener record.
interface ActiveSubscription extends DeferredListener {
	// The unsubscribe of each active store, in the same order. The value
	// could be undefined if the store is a custom generic store.
	unsubs: Array< VoidFunction | undefined >;
}

type AddToBucket = ( listener: DeferredListener ) => VoidFunction;

const deferredBuckets = new WeakMap<
	DataRegistry,
	Map< string, AddToBucket >
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
 * @return Unsubscribe function.
 */
function subscribeDeferred(
	registry: DataRegistry,
	storeName: string,
	listener: DeferredListener
): VoidFunction {
	let buckets = deferredBuckets.get( registry );
	if ( ! buckets ) {
		buckets = new Map();
		deferredBuckets.set( registry, buckets );
	}

	let addToBucket = buckets.get( storeName );
	if ( ! addToBucket ) {
		const listeners = new Set< DeferredListener >();
		const flush = () => {
			for ( const { context, callback } of listeners ) {
				renderQueue.add( context, callback );
			}
		};
		const unsubscribe = registry.subscribe(
			() => renderQueue.add( listeners, flush ),
			storeName
		);

		addToBucket = ( newListener ) => {
			listeners.add( newListener );

			return () => {
				if ( listeners.delete( newListener ) && listeners.size === 0 ) {
					buckets.delete( storeName );
					renderQueue.cancel( listeners );
					unsubscribe();
				}
			};
		};
		buckets.set( storeName, addToBucket );
	}

	return addToBucket( listener );
}

function getStoreState( registry: DataRegistry, name: string ): unknown {
	// If there's no store property (custom generic store), return an empty
	// object. When comparing the state, the empty objects will cause the
	// equality check to fail, setting `lastMapResultValid` to false.
	return registry.stores[ name ]?.store?.getState?.() ?? {};
}

// One object per hook, with shared methods: every mounted `useSelect` keeps
// it alive, so the less it holds, the less each block costs.
class Store {
	registry: DataRegistry;
	select: SelectFunction;
	mapSelect: MapSelect | undefined;
	lastMapResult: unknown;
	lastMapResultValid = false;
	lastIsAsync: boolean | undefined;
	didWarnUnstableReference: boolean | undefined;
	// The stores the `subscribe` function is supposed to subscribe to. They
	// are set by the first `mapSelect` call, and later calls can add to them.
	activeStores: string[] | undefined;
	// The state of each active store when the value was first computed.
	storeStatesOnMount: unknown[] | undefined;
	// The `subscribe` function, which is passed to the `useSyncExternalStore` hook, could
	// be called multiple times to establish multiple subscriptions. That's why we need to
	// keep a set of active subscriptions.
	activeSubscriptions = new Set< ActiveSubscription >();

	constructor( registry: DataRegistry, suspense: boolean ) {
		this.registry = registry;
		this.select = ( suspense
			? registry.suspendSelect
			: registry.select ) as unknown as SelectFunction;
	}

	// `useSyncExternalStore` takes functions, and the same ones on every
	// render saves it storing new ones after each render.
	subscribe = ( listener: () => void ): ( () => void ) => {
		const { registry, activeStores, storeStatesOnMount } = this;

		// Maybe invalidate the value right after subscription was created.
		// React will call `getValue` after subscribing, to detect store
		// updates that happened in the interval between the `getValue` call
		// during render and creating the subscription, which is slightly
		// delayed. We need to ensure that this second `getValue` call will
		// compute a fresh value only if any of the store states have
		// changed in the meantime.
		if ( this.lastMapResultValid ) {
			activeStores!.forEach( ( name, index ) => {
				if (
					storeStatesOnMount?.[ index ] !==
					getStoreState( registry, name )
				) {
					this.lastMapResultValid = false;
				}
			} );
		}

		this.storeStatesOnMount = undefined;

		const subscription: ActiveSubscription = {
			// The render queue coalesces the updates of each hook.
			context: this,
			callback: () => {
				// Invalidate the value on store update, so that a fresh value is computed.
				this.lastMapResultValid = false;
				listener();
			},
			unsubs: [],
		};
		subscription.unsubs = activeStores!.map( ( name ) =>
			this.listenToStore( subscription, name )
		);
		this.activeSubscriptions.add( subscription );

		return () => {
			this.activeSubscriptions.delete( subscription );

			for ( const unsub of subscription.unsubs ) {
				unsub?.();
			}
			// Cancel existing store updates that were already scheduled.
			renderQueue.cancel( this );
		};
	};

	getValue = () => {
		// Update the value in case it's been invalidated or `mapSelect` has changed.
		this.updateValue();
		return this.lastMapResult;
	};

	// Listen to one store on the tier that matches the current mode: async
	// listeners share one deferred subscription per store, sync ones listen
	// to the store directly.
	listenToStore( subscription: ActiveSubscription, storeName: string ) {
		if ( this.lastIsAsync ) {
			return subscribeDeferred( this.registry, storeName, subscription );
		}

		return this.registry.subscribe( subscription.callback, storeName );
	}

	updateValue(): void {
		const { registry, select, mapSelect } = this;

		// If the last value is valid, then we can safely return the cached value.
		// The value can change only on store update or a new `mapSelect`, and
		// both invalidate it.
		if ( this.lastMapResultValid ) {
			return;
		}

		const listeningStores = { current: null as string[] | null };
		const mapResult = registry.__unstableMarkListeningStores(
			() => mapSelect!( select, registry ),
			listeningStores
		);

		if ( ( globalThis as any ).SCRIPT_DEBUG ) {
			if ( ! this.didWarnUnstableReference ) {
				const secondMapResult = mapSelect!( select, registry );
				if ( ! isShallowEqual( mapResult, secondMapResult ) ) {
					warnOnUnstableReference( mapResult, secondMapResult );
					this.didWarnUnstableReference = true;
				}
			}
		}

		if ( ! this.activeStores ) {
			this.activeStores = listeningStores.current!;
			this.storeStatesOnMount = this.activeStores.map( ( name ) =>
				getStoreState( registry, name )
			);
		} else {
			// Check if the selector read stores we're not subscribed to yet, and add them.
			for ( const newStore of listeningStores.current! ) {
				if ( this.activeStores.includes( newStore ) ) {
					continue;
				}

				// New `subscribe` calls will subscribe to `newStore`, too.
				this.activeStores.push( newStore );

				// Add `newStore` to existing subscriptions.
				for ( const subscription of this.activeSubscriptions ) {
					subscription.unsubs.push(
						this.listenToStore( subscription, newStore )
					);
				}
			}
		}

		// If the new value is shallow-equal to the old one, keep the old one so
		// that we don't trigger unwanted updates that do a `===` check.
		if ( ! isShallowEqual( this.lastMapResult, mapResult ) ) {
			this.lastMapResult = mapResult;
		}
		this.lastMapResultValid = true;
	}

	update( mapSelect: MapSelect, isAsync: boolean ) {
		if ( mapSelect !== this.mapSelect ) {
			this.mapSelect = mapSelect;
			this.lastMapResultValid = false;
		}

		const wasAsync = this.lastIsAsync;
		// `listenToStore` reads the mode when it subscribes, so record it
		// before anything below can create or move a subscription.
		this.lastIsAsync = isAsync;

		// When transitioning from async to sync mode, cancel existing store updates
		// that have been scheduled, and invalidate the value so that it's freshly
		// computed. It might have been changed by the update we just cancelled.
		if ( wasAsync && ! isAsync ) {
			this.lastMapResultValid = false;
			renderQueue.cancel( this );
		}

		this.updateValue();

		// Each store subscription listens on the tier of the mode it was
		// created in, so a mode switch has to move the live ones over. Doing
		// it in place rather than by handing React a new `subscribe` identity
		// keeps the listener registered at all times, so a dispatch can't
		// slip through an unsubscribed gap.
		if ( wasAsync !== isAsync ) {
			this.switchMode();
		}
	}

	switchMode() {
		for ( const subscription of this.activeSubscriptions ) {
			subscription.unsubs.forEach( ( unsub, index ) => {
				unsub?.();
				subscription.unsubs[ index ] = this.listenToStore(
					subscription,
					this.activeStores![ index ]
				);
			} );
		}
	}
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
		() => new Store( registry, suspense ),
		[ registry, suspense ]
	);

	// These are "pass-through" dependencies from the parent hook,
	// and the parent should catch any hook rule violations.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const selector = useCallback( mapSelect, deps );
	store.update( selector, isAsync );
	const result = useSyncExternalStore(
		store.subscribe,
		store.getValue,
		store.getValue
	);
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
