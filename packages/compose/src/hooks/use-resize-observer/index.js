/**
 * External dependencies
 */
import useResizeAware from 'react-resize-aware';

/**
 * Hook which allows to listen the resize event of any target element when it changes sizes.
 * _Note: `useResizeObserver` will report `null` until after first render_
 *
 * @return {Array} An array of {Element} `resizeListener` and {?Object} `sizes` with properties `width` and `height`
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
