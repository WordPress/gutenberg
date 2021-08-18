/**
 * External dependencies
 */
import useResizeAware from 'react-resize-aware/dist/index.esm';

/**
 * WordPress dependencies
 */
import { useIsomorphicLayoutEffect } from '@wordpress/compose';

/**
 *
 * @param { { onResize?: () => any } } onResize
 */
export function useFlyoutResizeUpdater( { onResize } ) {
	const [ resizeListener, sizes ] = useResizeAware();

	useIsomorphicLayoutEffect( () => {
		onResize?.();
	}, [ sizes.width, sizes.height ] );

	return resizeListener;
}
