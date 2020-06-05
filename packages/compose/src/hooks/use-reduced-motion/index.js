/**
 * Internal dependencies
 */
import useMediaQuery from '../use-media-query';

/**
 * Whether or not the user agent is Internet Explorer.
 *
 * @type {boolean}
 */
const IS_IE =
	typeof window !== 'undefined' &&
	window.navigator.userAgent.indexOf( 'Trident' ) >= 0;

/** @type {boolean} */
let forceReducedMotion = false;
try {
	// @ts-ignore
	forceReducedMotion = process.env.FORCE_REDUCED_MOTION;
} catch {}

/**
 * Hook returning whether the user has a preference for reduced motion.
 *
 * @type {() => boolean} Reduced motion preference value.
 */
const useReducedMotion =
	forceReducedMotion || IS_IE
		? () => true
		: () => useMediaQuery( '(prefers-reduced-motion: reduce)' );

export default useReducedMotion;
