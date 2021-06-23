/**
 * External dependencies
 */
import { noop } from 'lodash';
import useResizeAware from 'react-resize-aware';

/**
 * WordPress dependencies
 */
import { useIsomorphicLayoutEffect } from '@wordpress/compose';

export function usePopoverResizeUpdater( { onResize = noop } ) {
	const [ resizeListener, sizes ] = useResizeAware();

	useIsomorphicLayoutEffect( () => {
		onResize();
	}, [ sizes.width, sizes.height ] );

	return resizeListener;
}
