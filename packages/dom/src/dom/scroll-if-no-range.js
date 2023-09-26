/**
 * If no range range can be created or it is outside the container, the element
 * may be out of view, so scroll it into view and try again.
 *
 * @param {HTMLElement} container  The container to scroll.
 * @param {boolean}     alignToTop True to align to top, false to bottom.
 * @param {Function}    callback   The callback to create the range.
 *
 * @return {?Range} The range returned by the callback.
 */
export function scrollIfNoRange( container, alignToTop, callback ) {
	let range = callback();

	// If no range range can be created or it is outside the container, the
	// element may be out of view.
	if (
		! range ||
		! range.startContainer ||
		! container.contains( range.startContainer )
	) {
		container.scrollIntoView( alignToTop );
		range = callback();

		if (
			! range ||
			! range.startContainer ||
			! container.contains( range.startContainer )
		) {
			return null;
		}
	}

	return range;
}
