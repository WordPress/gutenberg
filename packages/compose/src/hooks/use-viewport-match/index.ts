/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useMediaQuery from '../use-media-query';

type Breakpoint =
	| 'xhuge'
	| 'huge'
	| 'wide'
	| 'xlarge'
	| 'large'
	| 'medium'
	| 'small'
	| 'mobile';
type ViewportOperator = '>=' | '<';

/**
 * Hash of breakpoint names with pixel width at which it becomes effective.
 *
 * @see _breakpoints.scss
 */
const BREAKPOINTS: Record< Breakpoint, number > = {
	xhuge: 1920,
	huge: 1440,
	wide: 1280,
	xlarge: 1080,
	large: 960,
	medium: 782,
	small: 600,
	mobile: 480,
};

/**
 * Object mapping media query operators to the condition to be used.
 */
const CONDITIONS: Record< ViewportOperator, string > = {
	'>=': 'min-width',
	'<': 'max-width',
};

/**
 * Object mapping media query operators to a function that evaluates if the operator matches.
 */
const OPERATOR_EVALUATORS: Record<
	ViewportOperator,
	( breakpointValue: number, width: number ) => boolean
> = {
	'>=': ( breakpointValue, width ) => width >= breakpointValue,
	'<': ( breakpointValue, width ) => width < breakpointValue,
};

const ViewportMatchWidthContext = createContext< number | null >( null );
ViewportMatchWidthContext.displayName = 'ViewportMatchWidthContext';

/**
 * Returns true if the viewport matches the given query, or false otherwise.
 *
 * @param breakpoint Breakpoint size name.
 * @param operator   Viewport operator.
 * @param view       Window instance in which to perform viewport matching.
 *
 * @example
 *
 * ```ts
 * useViewportMatch( 'huge', '<' );
 * useViewportMatch( 'medium' );
 * ```
 *
 * @return Whether viewport matches query.
 */
const useViewportMatch = (
	breakpoint: Breakpoint,
	operator: ViewportOperator = '>=',
	// Resolve the default lazily so SSR (where `window` is undeclared) does not
	// throw a ReferenceError when this default expression is evaluated.
	view: Window | undefined = typeof window !== 'undefined'
		? window
		: undefined
): boolean => {
	const simulatedWidth = useContext( ViewportMatchWidthContext );
	const mediaQuery =
		! simulatedWidth &&
		`(${ CONDITIONS[ operator ] }: ${ BREAKPOINTS[ breakpoint ] }px)`;
	const mediaQueryResult = useMediaQuery( mediaQuery || undefined, view );

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
