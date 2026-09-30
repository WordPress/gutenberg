/**
 * Whether the user has asked their operating system to reduce motion.
 *
 * This is the counterpart to the `useReducedMotion` hook in
 * `@wordpress/compose`, for code that runs outside React such as block view
 * scripts. It reads the preference once; use `onReducedMotionChange` to react
 * to it changing.
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

/**
 * Calls a listener whenever the user's reduce motion preference changes.
 *
 * The listener is not called for the preference as it stands; read that with
 * `prefersReducedMotion`.
 *
 * @example
 * ```js
 * import { onReducedMotionChange } from '@wordpress/a11y';
 *
 * const unsubscribe = onReducedMotionChange( ( prefersReduced ) => {
 * 	if ( prefersReduced ) {
 * 		video.pause();
 * 	}
 * } );
 * ```
 *
 * @param listener Called with the new preference whenever it changes.
 *
 * @return A function that removes the listener.
 */
export function onReducedMotionChange(
	listener: ( prefersReducedMotion: boolean ) => void
): () => void {
	const query = window.matchMedia?.( '(prefers-reduced-motion: reduce)' );

	if ( ! query?.addEventListener ) {
		return () => {};
	}

	const handleChange = ( event: MediaQueryListEvent ) =>
		listener( event.matches );

	query.addEventListener( 'change', handleChange );

	return () => query.removeEventListener( 'change', handleChange );
}
