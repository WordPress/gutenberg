/**
 * External dependencies
 */
import useResizeAware from 'react-resize-aware';

/**
 * Hook which allows to listen the resize event of any target element when it changes sizes.
 * _Note: `useResizeObserver` will report `null` until after first render_
 *
 * Simply a re-export of `react-resize-aware` so refer to its documentation <https://github.com/FezVrasta/react-resize-aware>
 * for more details.
 *
 * @see https://github.com/FezVrasta/react-resize-aware
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
 *
 */
export default useResizeAware;
