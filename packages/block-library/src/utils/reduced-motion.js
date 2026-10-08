/**
 * Whether the user has asked their operating system to reduce motion.
 *
 * This is the counterpart to the `useReducedMotion` hook in
 * `@wordpress/compose`, for block view scripts, which run outside React. It
 * reads the preference once; callers that need to react to it changing should
 * watch the media query themselves.
 *
 * @return {boolean} Whether reduced motion is preferred.
 */
export function prefersReducedMotion() {
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
 * @param {(prefersReducedMotion: boolean) => void} listener Called with the new preference whenever it changes.
 *
 * @return {() => void} A function that removes the listener.
 */
export function onReducedMotionChange( listener ) {
	const query = window.matchMedia?.( '(prefers-reduced-motion: reduce)' );

	if ( ! query?.addEventListener ) {
		return () => {};
	}

	const handleChange = ( event ) => listener( event.matches );

	query.addEventListener( 'change', handleChange );

	return () => query.removeEventListener( 'change', handleChange );
}
