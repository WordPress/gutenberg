/**
 * Returns the originating event target, including through open shadow roots.
 *
 * Keyboard and clipboard events cross the shadow boundary, but `event.target`
 * is retargeted to the host. `composedPath()[0]` exposes the original node.
 *
 * @param {Event} event Event object.
 * @return {EventTarget} Originating target, or `event.target` as a fallback.
 */
export function getEventTarget( event ) {
	const path =
		typeof event.composedPath === 'function' && event.composedPath();
	return ( path && path[ 0 ] ) || event.target;
}
