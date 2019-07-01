/**
 * Internal dependencies
 */
import {
	createInterpolateString,
	createInterpolateElement,
	getInterpolateMap,
} from './utils';

/**
 * A component that allows for easier interpolation of values.
 *
 * This is useful for dynamic type string-like elements with embedded components
 * and values.
 *
 * @example
 *
 * ```js
 * const MyComponent = ( { url } ) => {
 *   return <Interpolate foo={ 'bar' } >
 *       This is a string with a <a href={ url }>linked <em>item</em></a> and a custom value: %%foo%%
 *   </Interpolate>;
 * }
 * ```
 *
 * @param {Object} props
 * @return {WPElement} An element.
 * @constructor
 */
const Interpolate = ( props ) => {
	return createInterpolateElement(
		createInterpolateString( props.children, props ),
		getInterpolateMap(),
	);
};

export default Interpolate;
