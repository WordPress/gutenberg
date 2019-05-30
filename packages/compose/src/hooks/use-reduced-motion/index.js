/**
 * Internal dependencies
 */
import useMediaQuery from '../use-media-query';

/**
 * Hook returning whether the user has a preference for reduced motion.
 *
 * @return {boolean} Reduced motion preference value.
 */
export default function useReducedMotion() {
	return useMediaQuery( '(prefers-reduced-motion: reduce)' );
}
