/**
 * @template T
 * @typedef Options
 * @property {T | undefined} initial  Initial value
 * @property {T | ""}        fallback Fallback value
 */

/** @type {Readonly<{ initial: undefined, fallback: '' }>} */

/**
 * Custom hooks for "controlled" components to track and consolidate internal
 * state and incoming values. This is useful for components that render
 * `input`, `textarea`, or `select` HTML elements.
 *
 * https://reactjs.org/docs/forms.html#controlled-components
 *
 * At first, a component using useControlledState receives an initial prop
 * value, which is used as initial internal state.
 *
 * This internal state can be maintained and updated without
 * relying on new incoming prop values.
 *
 * Unlike the basic useState hook, useControlledState's state can
 * be updated if a new incoming prop value is changed.
 *
 * @template T
 *
 * @param {T | undefined} currentState The current value.
 * @param {Options<T>} [options=defaultOptions] Additional options for the hook.
 *
 * @return {[T | "", (nextState: T) => void]} The controlled value and the value setter.
 */
export { useControlledState } from 'use-enhanced-state';
