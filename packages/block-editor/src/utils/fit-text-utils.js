/**
 * Shared utility functions for fit text functionality.
 */

/**
 * Finds optimal font size using simple binary search between 5-600px.
 *
 * @param {HTMLElement} textElement The text element.
 * @return {number}                 Optimal font size.
 */
export function optimizeFitText( textElement ) {
	if ( ! textElement ) {
		return 0;
	}

	textElement.style.fontSize = '';

	const alreadyHasScrollableHeight =
		textElement.scrollHeight > textElement.clientHeight;
	let minSize = 5;
	let maxSize = 600;
	let bestSize = minSize;

	while ( minSize <= maxSize ) {
		const midSize = Math.floor( ( minSize + maxSize ) / 2 );
		textElement.style.fontSize = midSize + 'px';

		const fitsWidth = textElement.scrollWidth <= textElement.clientWidth;
		const fitsHeight =
			alreadyHasScrollableHeight ||
			textElement.scrollHeight <= textElement.clientHeight;

		if ( fitsWidth && fitsHeight ) {
			bestSize = midSize;
			minSize = midSize + 1;
		} else {
			maxSize = midSize - 1;
			textElement.style.fontSize = midSize - 1 + 'px';
		}
	}

	return bestSize + 'px';
}
