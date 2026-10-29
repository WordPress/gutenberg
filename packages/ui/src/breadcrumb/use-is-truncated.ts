import { useIsomorphicLayoutEffect } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { FIT_TOLERANCE } from './layout';

function useIsTruncated(
	element: HTMLElement | null,
	measurementVersion: number
) {
	const [ isTruncated, setIsTruncated ] = useState( false );

	useIsomorphicLayoutEffect( () => {
		if ( ! element ) {
			setIsTruncated( false );
			return;
		}

		let isActive = true;
		const measure = () => {
			if ( ! isActive ) {
				return;
			}
			const next =
				element.scrollWidth - element.clientWidth > FIT_TOLERANCE;
			setIsTruncated( ( current ) =>
				current === next ? current : next
			);
		};

		measure();

		const resizeObserver =
			typeof ResizeObserver === 'function'
				? new ResizeObserver( measure )
				: undefined;
		resizeObserver?.observe( element );

		if ( typeof document !== 'undefined' && document.fonts ) {
			document.fonts.ready.then( measure );
		}

		return () => {
			isActive = false;
			resizeObserver?.disconnect();
		};
	}, [ element, measurementVersion ] );

	return isTruncated;
}

export { useIsTruncated };
