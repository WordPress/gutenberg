/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';
import {
	useLayoutEffect,
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

	const onStoreChange = useCallback( () => {
		if ( isMounted.current ) {
			const newMapOutput = latestMapSelect.current( registry.select, registry );
			if ( ! isShallowEqualObjects( latestMapOutput.current, newMapOutput ) ) {
				latestMapOutput.current = newMapOutput;
				setMapOutput( newMapOutput );
			}
		}
	}, [ registry ] );

	/**
	 * Set current values.
	 */
	useLayoutEffect( () => {
		latestMapSelect.current = mapSelect;
		isMounted.current = true;
	} );

	/**
	 * Flush queue if isAsync changes
	 */
	useLayoutEffect( () => {
		latestIsAsync.current = isAsync;
		renderQueue.flush( queueContext );
	}, [ isAsync ] );

	/**
	 * Map output should always be called if incoming prop dependencies
	 * has changed.
	 */
	useLayoutEffect( () => {
		onStoreChange();
	}, [ registry, nextProps ] );

	useLayoutEffect( () => {
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
	}, [ onStoreChange ] );

	return mapOutput;
}
