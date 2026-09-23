/**
 * Whether the user has asked their operating system to reduce motion.
 *
 * This is the counterpart to the `useReducedMotion` hook in
 * `@wordpress/compose`, for code that runs outside React such as block view
 * scripts. It reads the preference once; callers that need to react to it
 * changing should watch the media query themselves.
 *
 * @example
 * ```js
 * import { prefersReducedMotion } from '@wordpress/a11y';
 *
 * if ( ! prefersReducedMotion() ) {
 * 	video.play();
 * }
 * ```
 *
 * @return Whether reduced motion is preferred.
 */
export function prefersReducedMotion(): boolean {
	return (
		window.matchMedia?.( '(prefers-reduced-motion: reduce)' )?.matches ===
		true
	);
}
