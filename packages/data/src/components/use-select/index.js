/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';
import {
	useLayoutEffect,
	useRef,
	useMemo,
	useEffect,
	useReducer,
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
const useIsomorphicLayoutEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const renderQueue = createQueue();

export default function useSelect( mapSelect ) {
	const registry = useRegistry();
	const isAsync = useAsyncMode();
	const queueContext = useMemo( () => ( { queue: true } ), [ registry ] );
	const [ , forceRender ] = useReducer( ( s ) => s + 1, 0 );

	const latestMapSelect = useRef();
	const latestIsAsync = useRef( isAsync );
	const latestMapOutput = useRef();
	const isMounted = useRef();

	let mapOutput;

	if ( latestMapSelect.current !== mapSelect ) {
		mapOutput = mapSelect( registry.select, registry );
	} else {
		mapOutput = latestMapOutput.current;
	}

	useIsomorphicLayoutEffect( () => {
		latestMapSelect.current = mapSelect;
		if ( latestIsAsync.current !== isAsync ) {
			latestIsAsync.current = isAsync;
			renderQueue.flush( queueContext );
		}
		latestMapOutput.current = mapOutput;
		isMounted.current = true;
	} );

	useIsomorphicLayoutEffect( () => {
		const onStoreChange = () => {
			if ( isMounted.current ) {
				const newMapOutput = latestMapSelect.current( registry.select, registry );
				if ( ! isShallowEqualObjects( latestMapOutput.current, newMapOutput ) ) {
					latestMapOutput.current = newMapOutput;
					forceRender();
				}
			}
		};

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
