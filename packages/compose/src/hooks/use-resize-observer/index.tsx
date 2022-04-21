/**
 * External dependencies
 */
import useResizeObserver from 'use-resize-observer';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import type { WPElement } from '@wordpress/element';

/**
 * Hook which allows to listen the resize event of any target element when it changes sizes.
 * _Note: `useResizeObserver` will report `null` until after first render.
 *
 * @example
 *
 * ```js
 * const App = () => {
 * 	const [ resizeListener, sizes ] = useResizeObserver();
 *
 * 	return (
 * 		<div>
 * 			{ resizeListener }
 * 			Your content here
 * 		</div>
 * 	);
 * };
 * ```
 */
export default function useResizeAware(): [
	WPElement,
	{ width: number | null; height: number | null }
] {
	const { ref, width, height } = useResizeObserver();
	const sizes = useMemo( () => {
		return { width: width ?? null, height: height ?? null };
	}, [ width, height ] );
	const resizeListener = (
		<div
			style={ {
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				pointerEvents: 'none',
				opacity: 0,
				overflow: 'hidden',
				zIndex: -1,
			} }
			aria-hidden="true"
			ref={ ref }
		/>
	);
	return [ resizeListener, sizes ];
}
