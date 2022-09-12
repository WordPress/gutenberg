/**
 * Internal dependencies
 */
import { baseFlow } from './flow';

/**
 * Composes multiple higher-order components into a single higher-order component. Performs right-to-left function
 * composition, where each successive invocation is supplied the return value of the previous.
 *
 * This is inspired by `lodash`'s `flowRight` function.
 *
 * @see https://docs-lodash.com/v4/flow-right/
 */
const compose = baseFlow( true );

export default compose;
