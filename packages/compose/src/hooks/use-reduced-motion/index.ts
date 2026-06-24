/**
 * Internal dependencies
 */
import useMediaQuery from '../use-media-query';

/**
 * Hook returning whether the user has a preference for reduced motion.
 *
 * @return Reduced motion preference value.
 */
const useReducedMotion = (): boolean =>
	useMediaQuery( '(prefers-reduced-motion: reduce)' );

export default useReducedMotion;
