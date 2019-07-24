/**
 * Internal dependencies
 */
import useMediaQuery from '../use-media-query';

/**
 * Whether or not the user agent is Internet Explorer.
 *
 * @type {boolean}
 */
const IS_IE = window.navigator.userAgent.indexOf( 'Trident' ) >= 0;

/**
 * Hook returning whether the user has a preference for reduced motion.
 *
 * @return {boolean} Reduced motion preference value.
 */
const useReducedMotion =
	process.env.FORCE_REDUCED_MOTION || IS_IE ?
		() => true :
		() => useMediaQuery( '(prefers-reduced-motion: reduce)' );

export default useReducedMotion;
