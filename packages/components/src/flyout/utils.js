/**
 * WordPress dependencies
 */
import {
	useIsomorphicLayoutEffect,
	useResizeObserver,
} from '@wordpress/compose';

/**
 *
 * @param { { onResize?: () => any } } onResize
 */
export function useFlyoutResizeUpdater( { onResize } ) {
	const [ resizeListener, sizes ] = useResizeObserver();

	useIsomorphicLayoutEffect( () => {
		onResize?.();
	}, [ sizes.width, sizes.height ] );

	return resizeListener;
}
