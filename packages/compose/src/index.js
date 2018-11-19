/**
 * External dependencies
 */
import { flowRight } from 'lodash';

export { default as createHigherOrderComponent } from './create-higher-order-component';
export { default as ifCondition } from './if-condition';
export { default as pure } from './pure';
export { default as withGlobalEvents } from './with-global-events';
export { default as withInstanceId } from './with-instance-id';
export { default as withSafeTimeout } from './with-safe-timeout';
export { default as withState } from './with-state';

/**
 * Composes multiple higher-order components into a single higher-order component. Performs right-to-left function
 * composition, where each successive invocation is supplied the return value of the previous.
 *
 * @param {...Function} hocs The HOC functions to invoke.
 *
 * @return {Function} Returns the new composite function.
 */
export { flowRight as compose };
