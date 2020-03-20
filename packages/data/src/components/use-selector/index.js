/**
 * External dependencies
 */
import { useMemoOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';
import { useLayoutEffect, useReducer } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';
import useAsyncMode from '../async-mode-provider/use-async-mode';

const renderQueue = createQueue();

function useSelector( storeKey ) {
	const [ , forceRender ] = useReducer( () => ( {} ) );
	const registry = useRegistry();
	const isAsync = useAsyncMode();
	// React can sometimes clear the `useMemo` cache. Use the cache-stable
	// `useMemoOne` to avoid losing queues.
	const queueContext = useMemoOne( () => ( { queue: true } ), [ registry ] );

	useLayoutEffect( () => {
		renderQueue.flush( queueContext );
	}, [ isAsync ] );

	useLayoutEffect( () => {
		function onStoreChange() {
			if ( isAsync ) {
				renderQueue.add( queueContext, forceRender );
			} else {
				forceRender();
			}
		}

		// Catch any possible state changes during mount before the subscription
		// could be set.
		onStoreChange();

		const unsubscribe = registry.subscribe( onStoreChange );

		return () => {
			unsubscribe();
			renderQueue.flush( queueContext );
		};
	}, [ registry ] );

	return registry.select( storeKey );
}

export default useSelector;
