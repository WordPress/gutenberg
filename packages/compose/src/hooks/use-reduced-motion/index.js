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
 * Force reduced motion behavior at build time
 *
 * @type {boolean}
 */
let FORCE_REDUCED_MOTION = false;

// Prefer the try/catch to allow bundlers to replace `process.env.FORCE_REDUCED_MOTION` completely.
// Checks like `typeof process === 'object' && …` will be safe, but may short-circuit if a bundler
// has replaced `process.env.FORCE_REDUCED_MOTION` with `true`, but `window.process`
// remains undefined.
try {
	FORCE_REDUCED_MOTION = !! process.env.FORCE_REDUCED_MOTION;
} catch ( err ) {}

/**
 * Hook returning whether the user has a preference for reduced motion.
 *
 * @return {boolean} Reduced motion preference value.
 */
const useReducedMotion =
	FORCE_REDUCED_MOTION || IS_IE ?
		() => true :
		() => useMediaQuery( '(prefers-reduced-motion: reduce)' );

export default useReducedMotion;
