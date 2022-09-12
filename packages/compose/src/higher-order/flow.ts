/**
 * Creates a flow function.
 *
 * Allows to choose whether to perform left-to-right or right-to-left composition.
 *
 * @see https://docs-lodash.com/v4/flow/
 *
 * @param {boolean} reverse True if right-to-left, false for left-to-right composition.
 */
const baseFlow =
	( reverse: boolean = false ) =>
	( ...funcs: Function[] ) =>
	( ...args: unknown[] ) => {
		const functions = funcs.flat();
		if ( reverse ) {
			functions.reverse();
		}
		return functions.reduce(
			( prev, func ) => [ func( ...prev ) ],
			args
		)[ 0 ];
	};

/**
 * Composes multiple higher-order components into a single higher-order component. Performs left-to-right function
 * composition, where each successive invocation is supplied the return value of the previous.
 *
 * This is inspired by `lodash`'s `flow` function.
 *
 * @see https://docs-lodash.com/v4/flow/
 */
const flow = baseFlow();

export { baseFlow };

export default flow;
