/**
 * Internal dependencies
 */
import useMediaQuery from '../use-media-query';

/**
 * Hook returning whether the user has a preference for reduced motion.
 *
 * @return {boolean} Reduced motion preference value.
 */
const useReducedMotion =
	process.env.FORCE_REDUCED_MOTION ?
		() => true :
		() => useMediaQuery( '(prefers-reduced-motion: reduce)' );

export default useReducedMotion;
