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
 * @template C
 */
/**
 * @typedef {import('../../types').ReduxStoreConfig<State,Actions,Selectors>} ReduxStoreConfig
 * @template State,Actions,Selectors
 */
/**
 * @typedef {import('../../types').UseSelectReturn<T>} UseSelectReturn
 * @template T
 */
/** @typedef {import('../../types').MapSelect} MapSelect */

function Store( registry, suspense ) {
	const select = suspense ? registry.suspendSelect : registry.select;
	const queueContext = {};
	let lastMapSelect;
	let lastMapResult;
	let lastMapResultValid = false;
	let lastIsAsync;
	let subscribe;

	function createSubscriber( stores ) {
		return ( listener ) => {
			lastMapResultValid = false;

			const onStoreChange = () => {
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
				renderQueue.cancel( queueContext );
			};
		};
	}

	return ( mapSelect, resub, isAsync ) => {
		function selectValue() {
			return mapSelect( select, registry );
		}

		function updateValue( selectFromStore ) {
			if ( lastMapResultValid && mapSelect === lastMapSelect ) {
				return lastMapResult;
			}

			const mapResult = selectFromStore();

			if ( ! isShallowEqual( lastMapResult, mapResult ) ) {
				lastMapResult = mapResult;
			}
			lastMapResultValid = true;
		}

		function getValue() {
			updateValue( selectValue );
			return lastMapResult;
		}

		if ( lastIsAsync && ! isAsync ) {
			lastMapResultValid = false;
			renderQueue.cancel( queueContext );
		}

		const listeningStores = { current: null };
		updateValue( () =>
			registry.__unstableMarkListeningStores(
				selectValue,
				listeningStores
			)
		);

		if ( ! lastMapSelect || ( resub && mapSelect !== lastMapSelect ) ) {
			subscribe = createSubscriber( listeningStores.current );
		}
		lastIsAsync = isAsync;
		lastMapSelect = mapSelect;

		return { getValue, subscribe };
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
	const { getValue, subscribe } = store( selector, !! deps, isAsync );
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
