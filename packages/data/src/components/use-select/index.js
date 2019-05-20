/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';
import {
	useLayoutEffect,
	useEffect,
	useState,
	useRef,
	useMemo,
	useCallback,
} from '@wordpress/element';
import { isShallowEqualObjects } from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import useRegistry from '../registry-provider/use-registry';
import useAsyncMode from '../async-mode-provider/use-async-mode';

/**
 * Favor useLayoutEffect to ensure the store subscription callback always has
 * the selector from the latest render. If a store update happens between render
 * and the effect, this could cause missed/stale updates or inconsistent state.
 *
 * Fallback to useEffect for server rendered components because currently React
 * throws a warning when using useLayoutEffect in that environment.
 */
// const useIsomorphicLayoutEffect = typeof window !== 'undefined' ?
// 	useLayoutEffect : useEffect;
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ?
	useLayoutEffect : useEffect;

const renderQueue = createQueue();

export default function useSelect( mapSelect, nextProps ) {
	const registry = useRegistry();
	const isAsync = useAsyncMode();
	const [ mapOutput, setMapOutput ] = useState( mapSelect( registry.select ) );
	const queueContext = useMemo( () => ( { queue: true } ), [ registry ] );

	const latestMapSelect = useRef( mapSelect );
	const latestIsAsync = useRef( isAsync );
	const latestMapOutput = useRef( mapOutput );
	const isMounted = useRef();

	/**
	 * Set current values.
	 */
	useIsomorphicLayoutEffect( () => {
		latestMapSelect.current = mapSelect;
		isMounted.current = true;
	} );

	/**
	 * Flush queue if isAsync changes
	 */
	useIsomorphicLayoutEffect( () => {
		latestIsAsync.current = isAsync;
		renderQueue.flush( queueContext );
	}, [ isAsync ] );

	/**
	 * Callback for doing changes to store.
	 */
	const onStoreChange = useCallback( () => {
		if ( isMounted.current ) {
			const newMapOutput = latestMapSelect.current( registry.select, registry );
			if ( ! isShallowEqualObjects( latestMapOutput.current, newMapOutput ) ) {
				latestMapOutput.current = newMapOutput;
				setMapOutput( newMapOutput );
			}
		}
	}, [ registry, nextProps ] );

	/**
	 * Map output should always be called if incoming prop dependencies
	 * has changed.
	 */
	useIsomorphicLayoutEffect( () => {
		onStoreChange();
	}, [ registry, nextProps ] );

	useIsomorphicLayoutEffect( () => {
		const unsubscribe = registry.subscribe( () => {
			if ( latestIsAsync.current ) {
				renderQueue.add( queueContext, onStoreChange );
			} else {
				onStoreChange();
			}
		} );

		return () => {
			isMounted.current = false;
			unsubscribe();
			renderQueue.flush( queueContext );
		};
	}, [ registry ] );

	return mapOutput;
}
