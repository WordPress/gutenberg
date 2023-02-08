/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';
import {
	useRef,
	useCallback,
	useMemo,
	useSyncExternalStore,
	useDebugValue,
} from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';
import useAsyncMode from '../async-mode-provider/use-async-mode';

const renderQueue = createQueue();

/**
 * @typedef {import('../../types').StoreDescriptor<C>} StoreDescriptor
 * @template {import('../../types').AnyConfig} C
 */
/**
 * @typedef {import('../../types').ReduxStoreConfig<State,Actions,Selectors>} ReduxStoreConfig
 * @template State,Selectors
 * @template {Record<string,import('../../types').ActionCreator>} Actions
 */
/** @typedef {import('../../types').MapSelect} MapSelect */
/**
 * @typedef {import('../../types').UseSelectReturn<T>} UseSelectReturn
 * @template {MapSelect|StoreDescriptor<any>} T
 */

function Store( registry, suspense ) {
	const select = suspense ? registry.suspendSelect : registry.select;
	const queueContext = {};
	let lastMapSelect;
	let lastMapResult;
	let lastMapResultValid = false;
	let lastIsAsync;
	let subscribe;

	const createSubscriber = ( stores ) => ( listener ) => {
		// Invalidate the value right after subscription was created. React will
		// call `getValue` after subscribing, to detect store updates that happened
		// in the interval between the `getValue` call during render and creating
		// the subscription, which is slightly delayed. We need to ensure that this
		// second `getValue` call will compute a fresh value.
		lastMapResultValid = false;

		const onStoreChange = () => {
			// Invalidate the value on store update, so that a fresh value is computed.
			lastMapResultValid = false;
			listener();
		};

		const onChange = () => {
			if ( lastIsAsync ) {
				renderQueue.add( queueContext, onStoreChange );
			} else {
				onStoreChange();
			}
		};

		const unsubs = stores.map( ( storeName ) => {
			return registry.subscribe( onChange, storeName );
		} );

		return () => {
			// The return value of the subscribe function could be undefined if the store is a custom generic store.
			for ( const unsub of unsubs ) {
				unsub?.();
			}
			// Cancel existing store updates that were already scheduled.
			renderQueue.cancel( queueContext );
		};
	};

	return ( mapSelect, resubscribe, isAsync ) => {
		const selectValue = () => mapSelect( select, registry );

		function updateValue( selectFromStore ) {
			// If the last value is valid, and the `mapSelect` callback hasn't changed,
			// then we can safely return the cached value. The value can change only on
			// store update, and in that case value will be invalidated by the listener.
			if ( lastMapResultValid && mapSelect === lastMapSelect ) {
				return lastMapResult;
			}

			const mapResult = selectFromStore();

			// If the new value is shallow-equal to the old one, keep the old one so
			// that we don't trigger unwanted updates that do a `===` check.
			if ( ! isShallowEqual( lastMapResult, mapResult ) ) {
				lastMapResult = mapResult;
			}
			lastMapResultValid = true;
		}

		function getValue() {
			// Update the value in case it's been invalidated or `mapSelect` has changed.
			updateValue( selectValue );
			return lastMapResult;
		}

		// When transitioning from async to sync mode, cancel existing store updates
		// that have been scheduled, and invalidate the value so that it's freshly
		// computed. It might have been changed by the update we just cancelled.
		if ( lastIsAsync && ! isAsync ) {
			lastMapResultValid = false;
			renderQueue.cancel( queueContext );
		}

		// Either initialize the `subscribe` function, or create a new one if `mapSelect`
		// changed and has dependencies.
		// Usage without dependencies, `useSelect( ( s ) => { ... } )`, will subscribe
		// only once, at mount, and won't resubscibe even if `mapSelect` changes.
		if ( ! subscribe || ( resubscribe && mapSelect !== lastMapSelect ) ) {
			// Find out what stores the `mapSelect` callback is selecting from and
			// use that list to create subscriptions to specific stores.
			const listeningStores = { current: null };
			updateValue( () =>
				registry.__unstableMarkListeningStores(
					selectValue,
					listeningStores
				)
			);
			subscribe = createSubscriber( listeningStores.current );
		} else {
			updateValue( selectValue );
		}

		lastIsAsync = isAsync;
		lastMapSelect = mapSelect;

		// Return a pair of functions that can be passed to `useSyncExternalStore`.
		return { subscribe, getValue };
	};
}

function useStaticSelect( storeName ) {
	return useRegistry().select( storeName );
}

function useMappingSelect( suspense, mapSelect, deps ) {
	const registry = useRegistry();
	const isAsync = useAsyncMode();
	const store = useMemo( () => Store( registry, suspense ), [ registry ] );
	const selector = useCallback( mapSelect, deps );
	const { subscribe, getValue } = store( selector, !! deps, isAsync );
	const result = useSyncExternalStore( subscribe, getValue, getValue );
	useDebugValue( result );
	return result;
}

/**
 * Custom react hook for retrieving props from registered selectors.
 *
 * In general, this custom React hook follows the
 * [rules of hooks](https://reactjs.org/docs/hooks-rules.html).
 *
 * @template {MapSelect | StoreDescriptor<any>} T
 * @param {T}         mapSelect Function called on every state change. The returned value is
 *                              exposed to the component implementing this hook. The function
 *                              receives the `registry.select` method on the first argument
 *                              and the `registry` on the second argument.
 *                              When a store key is passed, all selectors for the store will be
 *                              returned. This is only meant for usage of these selectors in event
 *                              callbacks, not for data needed to create the element tree.
 * @param {unknown[]} deps      If provided, this memoizes the mapSelect so the same `mapSelect` is
 *                              invoked on every state change unless the dependencies change.
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
 * @return {UseSelectReturn<T>} A custom react hook.
 */
export default function useSelect( mapSelect, deps ) {
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

	/* eslint-disable react-hooks/rules-of-hooks */
	// `staticSelectMode` is not allowed to change during the hook instance's,
	// lifetime, so the rules of hooks are not really violated.
	return staticSelectMode
		? useStaticSelect( mapSelect )
		: useMappingSelect( false, mapSelect, deps );
	/* eslint-enable react-hooks/rules-of-hooks */
}

/**
 * A variant of the `useSelect` hook that has the same API, but will throw a
 * suspense Promise if any of the called selectors is in an unresolved state.
 *
 * @param {Function} mapSelect Function called on every state change. The
 *                             returned value is exposed to the component
 *                             using this hook. The function receives the
 *                             `registry.suspendSelect` method as the first
 *                             argument and the `registry` as the second one.
 * @param {Array}    deps      A dependency array used to memoize the `mapSelect`
 *                             so that the same `mapSelect` is invoked on every
 *                             state change unless the dependencies change.
 *
 * @return {Object} Data object returned by the `mapSelect` function.
 */
export function useSuspenseSelect( mapSelect, deps ) {
	return useMappingSelect( true, mapSelect, deps );
}
