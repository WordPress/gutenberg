/**
 * External dependencies
 */
import { useMemoOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';
import { useRef, useCallback, useMemo, useReducer } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';
import useAsyncMode from '../async-mode-provider/use-async-mode';
import { useSelectors } from '@wordpress/data';

const renderQueue = createQueue();

/** @typedef {import('../../types').StoreDescriptor} StoreDescriptor */

/**
 * Custom react hook for retrieving props from registered selectors.
 *
 * In general, this custom React hook follows the
 * [rules of hooks](https://reactjs.org/docs/hooks-rules.html).
 *
 * @param {Function|StoreDescriptor|string} mapSelect Function called on every state change. The
 *                                                    returned value is exposed to the component
 *                                                    implementing this hook. The function receives
 *                                                    the `registry.select` method on the first
 *                                                    argument and the `registry` on the second
 *                                                    argument.
 *                                                    (deprecated) When a store key is passed, all
 *                                                    selectors for the store will be returned. This
 *                                                    is only meant for usage of these selectors in
 *                                                    event callbacks, not for data needed to create
 *                                                    the element tree.
 * @param {Array}                           deps      If provided, this memoizes the mapSelect so the
 *                                                    same `mapSelect` is invoked on every state
 *                                                    change unless the dependencies change.
 *
 * @example
 * ```js
 * import { useSelect } from '@wordpress/data';
 *
 * function HammerPriceDisplay( { currency } ) {
 *   const price = useSelect( ( select ) => {
 *     return select( 'my-shop' ).getPrice( 'hammer', currency )
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
 * on render, so you need to use useSelectors instead. For backwards compatibility
 * only, this function still supports getting the selectors by passing a store.
 *
 * **Don't use `useSelect` this way when calling the selectors in the render
 * function because your component won't re-render on a data change.**
 *
 * ```js
 * import { useSelect } from '@wordpress/data';
 *
 * function Paste( { children } ) {
 *   const { getSettings } = useSelect( 'my-shop' );
 *   function onPaste() {
 *     // Do something with the settings.
 *     const settings = getSettings();
 *   }
 *   return <div onPaste={ onPaste }>{ children }</div>;
 * }
 * ```
 *
 * @return {any}  The current map output or a store's selectors.
 */
export default function useSelect( mapSelect, deps ) {
	// This is a deliberate rules-of-hooks violation that is safe to do because mapSelect's type stays stable over time.
	// In almost any other case you should never do this in a hook.
	// The rule needs to be disabled inside the entire function body.
	/* eslint-disable react-hooks/rules-of-hooks */
	if ( typeof mapSelect !== 'function' ) {
		return useSelectors( mapSelect );
	}
	const _mapSelect = useCallback( mapSelect, deps );
	const registry = useRegistry();
	const isAsync = useAsyncMode();
	// React can sometimes clear the `useMemo` cache.
	// We use the cache-stable `useMemoOne` to avoid
	// losing queues.
	const queueContext = useMemoOne( () => ( { queue: true } ), [ registry ] );
	const [ , forceRender ] = useReducer( ( s ) => s + 1, 0 );

	const latestMapSelect = useRef();
	const latestIsAsync = useRef( isAsync );
	const latestMapOutput = useRef();
	const latestMapOutputError = useRef();
	const isMountedAndNotUnsubscribing = useRef();

	// Keep track of the stores being selected in the _mapSelect function,
	// and only subscribe to those stores later.
	const listeningStores = useRef( [] );
	const wrapSelect = useCallback(
		( callback ) =>
			registry.__unstableMarkListeningStores(
				() => callback( registry.select, registry ),
				listeningStores
			),
		[ registry ]
	);

	// Generate a "flag" for used in the effect dependency array.
	// It's different than just using `mapSelect` since deps could be undefined,
	// in that case, we would still want to memoize it.
	const depsChangedFlag = useMemo( () => ( {} ), deps || [] );

	let mapOutput = latestMapOutput.current;

	const hasReplacedMapSelect = latestMapSelect.current !== _mapSelect;
	const lastMapSelectFailed = !! latestMapOutputError.current;

	if ( hasReplacedMapSelect || lastMapSelectFailed ) {
		try {
			mapOutput = wrapSelect( _mapSelect );
		} catch ( error ) {
			let errorMessage = `An error occurred while running 'mapSelect': ${ error.message }`;

			if ( latestMapOutputError.current ) {
				errorMessage += `\nThe error may be correlated with this previous error:\n`;
				errorMessage += `${ latestMapOutputError.current.stack }\n\n`;
				errorMessage += 'Original stack trace:';
			}

			// eslint-disable-next-line no-console
			console.error( errorMessage );
		}
	}

	useIsomorphicLayoutEffect( () => {
		latestMapSelect.current = _mapSelect;
		latestMapOutput.current = mapOutput;
		latestMapOutputError.current = undefined;
		isMountedAndNotUnsubscribing.current = true;

		// This has to run after the other ref updates
		// to avoid using stale values in the flushed
		// callbacks or potentially overwriting a
		// changed `latestMapOutput.current`.
		if ( latestIsAsync.current !== isAsync ) {
			latestIsAsync.current = isAsync;
			renderQueue.flush( queueContext );
		}
	} );

	useIsomorphicLayoutEffect( () => {
		const onStoreChange = () => {
			if ( isMountedAndNotUnsubscribing.current ) {
				try {
					const newMapOutput = wrapSelect( latestMapSelect.current );

					if (
						isShallowEqual( latestMapOutput.current, newMapOutput )
					) {
						return;
					}
					latestMapOutput.current = newMapOutput;
				} catch ( error ) {
					latestMapOutputError.current = error;
				}
				forceRender();
			}
		};

		const onChange = () => {
			if ( latestIsAsync.current ) {
				renderQueue.add( queueContext, onStoreChange );
			} else {
				onStoreChange();
			}
		};

		// Catch any possible state changes during mount before the subscription
		// could be set.
		onChange();

		const unsubscribers = listeningStores.current.map( ( storeName ) =>
			registry.__unstableSubscribeStore( storeName, onChange )
		);

		return () => {
			isMountedAndNotUnsubscribing.current = false;
			// The return value of the subscribe function could be undefined if the store is a custom generic store.
			unsubscribers.forEach( ( unsubscribe ) => unsubscribe?.() );
			renderQueue.flush( queueContext );
		};
		// If you're tempted to eliminate the spread dependencies below don't do it!
		// We're passing these in from the calling function and want to make sure we're
		// examining every individual value inside the `deps` array.
	}, [ registry, wrapSelect, depsChangedFlag ] );

	return mapOutput;
	/* eslint-enable react-hooks/rules-of-hooks */
}
