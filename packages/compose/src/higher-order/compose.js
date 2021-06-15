/**
 * External dependencies
 */
import compose from 'lodash/flowRight';

/* eslint-disable jsdoc/valid-types */
/**
 * Composes multiple higher-order components into a single higher-order component. Performs right-to-left function
 * composition, where each successive invocation is supplied the return value of the previous.
 *
 * This is just a re-export of `lodash`'s `flowRight` function.
 *
 * @see https://docs-lodash.com/v4/flow-right/
 *
 * @type {import('lodash').LoDashStatic['flowRight']}
 */
export default compose;
/* eslint-enable jsdoc/valid-types */
