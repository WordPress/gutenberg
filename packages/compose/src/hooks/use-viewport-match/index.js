/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useMediaQuery from '../use-media-query';

/**
 * @typedef {"huge"|"wide"|"large"|"medium"|"small"|"mobile"} WPBreakpoint
 */

/**
 * Hash of breakpoint names with pixel width at which it becomes effective.
 *
 * @see _breakpoints.scss
 *
 * @type {Record<WPBreakpoint,number>}
 */
const BREAKPOINTS = {
	huge: 1440,
	wide: 1280,
	large: 960,
	medium: 782,
	small: 600,
	mobile: 480,
};

/**
 * @typedef {">="|"<"} WPViewportOperator
 */

/**
 * Object mapping media query operators to the condition to be used.
 *
 * @type {Object<WPViewportOperator,string>}
 */
const CONDITIONS = {
	'>=': 'min-width',
	'<': 'max-width',
};

/**
 * @callback EvaluatorFunc
 *
 * @param {typeof BREAKPOINTS[keyof typeof BREAKPOINTS]} breakpointValue
 * @param {number} width
 *
 * @return {boolean}
 */

/**
 * Object mapping media query operators to a function that given a breakpointValue and a width evaluates if the operator matches the values.
 *
 * @type {Record<WPViewportOperator, EvaluatorFunc>}
 */
const OPERATOR_EVALUATORS = {
	'>=': ( breakpointValue, width ) => width >= breakpointValue,
	'<': ( breakpointValue, width ) => width < breakpointValue,
};

const ViewportMatchWidthContext = createContext(
	/** @type {number | null} */ ( null )
);

/**
 * Returns true if the viewport matches the given query, or false otherwise.
 *
 * @param {WPBreakpoint}       breakpoint      Breakpoint size name.
 * @param {WPViewportOperator} [operator=">="] Viewport operator.
 *
 * @example
 *
 * ```js
 * useViewportMatch( 'huge', '<' );
 * useViewportMatch( 'medium' );
 * ```
 *
 * @return {boolean} Whether viewport matches query.
 */
const useViewportMatch = ( breakpoint, operator = '>=' ) => {
	const simulatedWidth = useContext( ViewportMatchWidthContext );

	const mediaQuery = simulatedWidth
		? `(${ CONDITIONS[ operator ] }: ${ BREAKPOINTS[ breakpoint ] }px)`
		: undefined;

	const mediaQueryResult = useMediaQuery( mediaQuery );
	if ( simulatedWidth ) {
		return OPERATOR_EVALUATORS[ operator ](
			BREAKPOINTS[ breakpoint ],
			simulatedWidth
		);
	}
	return mediaQueryResult;
};

useViewportMatch.__experimentalWidthProvider =
	ViewportMatchWidthContext.Provider;

export default useViewportMatch;
