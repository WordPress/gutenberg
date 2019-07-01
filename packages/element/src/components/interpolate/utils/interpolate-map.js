/**
 * An ordered array that describes the replacements that should be made on a
 * translated string.
 *
 * Example, given a string with:
 *
 * 'This is a <strong%1>string</strong%1> with
 * <a%1><em%1>emphasized</em%1>link</a%1> and a <span%1>custom
 * component</span%1> along with a custom value of %1$d'
 *
 * The translation replace map for the above might be something like this.
 *
 * ```js
 * const interpolationMap = [
 * 	[ 'strong%1', { tag: 'strong', props: {}, hasChildren: true } ],
 * 	[ 'a%1', { tag: 'a', props: {}, hasChildren: true } ],
 * 	[ 'em%1', { tag: 'em', props: {}, hasChildren: false } ],
 * 	[ 'span%1', { tag: CustomComponent, props: {} hasChildren: true } ],
 * 	[ '%1$d', { value: 10 } ]
 * ]
 * ```
 *
 * @type {Array}  An ordered map of values describing the interpolation.
 */
let interpolateMap = [];

/**
 * Adds a prop value to the interpolate map.
 *
 * Prop value is a value that is replaced on a sprintf like token; `%1$s`.
 *
 * @param {string} searchString  The search string for what will be replaced by
 *                               the value.
 * @param {*}      value
 */
const addPropValueToInterpolateMap = ( searchString, value ) => {
	interpolateMap.push( [
		searchString,
		{ value },
	] );
};

/**
 * Returns the current interpolate map.
 *
 * @return {Array}  The current interpolate map
 */
const getInterpolateMap = () => interpolateMap;

/**
 * Resets the current interpolate map.
 */
const resetInterpolateMap = () => {
	interpolateMap = [];
};

/**
 * Adds element related values to the interpolate map.
 *
 * These are used to construct a react element when replacing what is
 * represented as the search string in the interpolation string.
 *
 * @param {string}           searchString  The token part used for generating
 *                                         the search regex.
 * @param {string|Component} tag           Either the native tag or a react
 *                                         component.
 * @param {Object}           props         The props to pass to the generated
 *                                         component.
 * @param {boolean}          hasChildren   Whether this component has children
 *                                         (which will be parsed from the
 *                                         interpolation string)
 */
const addElementToInterpolateMap = ( searchString, tag, props, hasChildren ) => {
	interpolateMap.push( [
		searchString,
		{
			tag,
			props,
			hasChildren,
		},
	] );
};

export {
	addPropValueToInterpolateMap,
	getInterpolateMap,
	resetInterpolateMap,
	addElementToInterpolateMap,
};
