/**
 * External dependencies
 */
import { noop } from 'lodash';
import useResizeAware from 'react-resize-aware';

/**
 * Internal dependencies
 */
import { useIsomorphicLayoutEffect } from '../utils';

export function usePopoverResizeUpdater( { onResize = noop } ) {
	const [ resizeListener, sizes ] = useResizeAware();

	useIsomorphicLayoutEffect( () => {
		onResize();
	}, [ sizes.width, sizes.height ] );

	return resizeListener;
}
