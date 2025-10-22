/**
 * Shared utility functions for fit text functionality.
 * Uses callback-based approach for maximum code reuse between editor and frontend.
 */

/**
 * Generate CSS rule for single text element.
 *
 * @param {string} elementSelector CSS selector for the text element
 * @param {number} fontSize        Font size in pixels
 * @return {string} CSS rule string
 */
function generateCSSRule( elementSelector, fontSize ) {
	return `${ elementSelector } { font-size: ${ fontSize }px !important; }`;
}

/**
 * Find optimal font size using simple binary search between 5-600px.
 *
 * @param {HTMLElement} textElement     The text element
 * @param {string}      elementSelector CSS selector for the text element
 * @param {Function}    applyStylesFn   Function to apply test styles
 * @param {number}      maxSize         Maximum font size in pixels (default: 600)
 * @return {number} Optimal font size
 */
function findOptimalFontSize(
	textElement,
	elementSelector,
	applyStylesFn,
	maxSize = 600
) {
	const alreadyHasScrollableHeight =
		textElement.scrollHeight > textElement.clientHeight;
	let minSize = 5;
	let bestSize = minSize;

	while ( minSize <= maxSize ) {
		const midSize = Math.floor( ( minSize + maxSize ) / 2 );
		applyStylesFn( generateCSSRule( elementSelector, midSize ) );

		const fitsWidth = textElement.scrollWidth <= textElement.clientWidth;
		const fitsHeight =
			alreadyHasScrollableHeight ||
			textElement.scrollHeight <= textElement.clientHeight;

		if ( fitsWidth && fitsHeight ) {
			bestSize = midSize;
			minSize = midSize + 1;
		} else {
			maxSize = midSize - 1;
		}
	}

	return bestSize;
}

/**
 * Complete fit text optimization for a single text element.
 * Handles the full flow using callbacks for style management.
 *
 * @param {HTMLElement} textElement     The text element (paragraph, heading, etc.)
 * @param {string}      elementSelector CSS selector for the text element
 * @param {Function}    applyStylesFn   Function to apply CSS styles (pass empty string to clear)
 * @param {number}      maxSize         Maximum font size in pixels.
 */
export function optimizeFitText(
	textElement,
	elementSelector,
	applyStylesFn,
	maxSize
) {
	if ( ! textElement ) {
		return;
	}

	applyStylesFn( '' );

	const optimalSize = findOptimalFontSize(
		textElement,
		elementSelector,
		applyStylesFn,
		maxSize
	);

	const cssRule = generateCSSRule( elementSelector, optimalSize );
	applyStylesFn( cssRule );
}
