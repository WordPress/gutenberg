/**
 * External dependencies
 */
import createStore from 'zustand';

/**
 * The internal store for non-device reduced-motion preferences. Creating
 * this state in this manner allows for the state value to be shared and used
 * amongst various components without the need of a Context provider.
 *
 * Ideally, you would interface with this store using the useReducedMotion hook.
 */
/** @type {import('zustand').UseStore<{ isReducedMotion: boolean, setIsReducedMotion: (next: boolean) => void }>} */
export const useReducedMotionState = createStore( ( setState ) => ( {
	isReducedMotion: false,
	setIsReducedMotion: ( /** @type {boolean} */ next ) => {
		setState( () => ( { isReducedMotion: next } ) );
	},
} ) );

/**
 * A hook that can subscribe to and set preferences for reducedMotion within
 * the entire Style system.
 *
 * @return {[boolean, (reducedMotion: boolean) => void]} The state and setState for reduced motion.
 */
export function useReducedMotion() {
	const state = useReducedMotionState( ( s ) => s.isReducedMotion );
	const setState = useReducedMotionState( ( s ) => s.setIsReducedMotion );

	return [ state, setState ];
}
