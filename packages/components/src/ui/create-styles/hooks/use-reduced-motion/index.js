/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import IS_REDUCED_MOTION_STORE from './store';

/**
 * @return {[boolean, (isReducedMotion: boolean) => void]} Whether reduced motion is enabled as well as a function to set the value of reduced motion.
 */
export const useReducedMotion = () => {
	const isReducedMotion = useSelect( (
		/** @type {(storeKey: string) => { getIsReducedMotion: () => boolean }} */ select
	) => {
		return select( IS_REDUCED_MOTION_STORE ).getIsReducedMotion();
	} );
	const { setIsReducedMotion } = useDispatch( IS_REDUCED_MOTION_STORE );

	return [ /** @type {boolean} */ ( isReducedMotion ), setIsReducedMotion ];
};
