/**
 * Used to read/write state to localStorage.
 *
 * @template T
 * @param {T | undefined} currentState The current value.
 *
 * @return {[T | "", (nextState: T) => void]} The state an state setter.
 */
export { useLocalState } from 'use-enhanced-state';
