/**
 * Breakpoint names supported by the viewport package.
 */
export type BreakpointName =
	| 'huge'
	| 'wide'
	| 'large'
	| 'medium'
	| 'small'
	| 'mobile';

/**
 * Query operators for viewport matching.
 */
export type QueryOperator = '<' | '>=';

/**
 * A viewport query string combining operator and breakpoint.
 * Examples: '< small', '>= medium', 'large' (defaults to '>= large')
 */
export type ViewportQuery =
	| BreakpointName
	| `${ QueryOperator } ${ BreakpointName }`;

/**
 * Hash of breakpoint names with pixel width at which it becomes effective.
 */
export interface Breakpoints {
	huge: number;
	wide: number;
	large: number;
	medium: number;
	small: number;
	mobile: number;
}

/**
 * Hash of query operators with corresponding condition for media query.
 */
export interface Operators {
	'<': 'max-width';
	'>=': 'min-width';
}

/**
 * Object mapping viewport queries to their matching state.
 */
export interface ViewportState {
	[ query: string ]: boolean;
}

/**
 * Object mapping prop names to viewport queries.
 */
export interface ViewportQueries {
	[ propName: string ]: ViewportQuery;
}

/**
 * Action for setting viewport matching state.
 */
export interface SetIsMatchingAction {
	type: 'SET_IS_MATCHING';
	values: ViewportState;
}

/**
 * All possible actions for the viewport store.
 */
export type ViewportAction = SetIsMatchingAction;
