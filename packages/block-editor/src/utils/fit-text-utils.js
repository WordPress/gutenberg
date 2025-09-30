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
 * Get original font size of a single text element.
 *
 * @param {HTMLElement} textElement   The text element (paragraph, heading, etc.)
 * @param {Function}    applyStylesFn Function to apply/clear styles
 * @return {number} Original font size in pixels
 */
export function getOriginalFontSize( textElement, applyStylesFn ) {
	if ( ! textElement ) {
		return 16; // Default fallback
	}

	// Clear existing fit text styles to measure natural size
	applyStylesFn( '' );

	// Measure natural font size
	const computedStyle = window.getComputedStyle( textElement );
	const fontSize = parseFloat( computedStyle.fontSize );

	return fontSize || 16; // Fallback to 16px
}

/**
 * Find optimal font size using simple binary search between 5-600px.
 *
 * @param {HTMLElement} textElement     The text element
 * @param {string}      elementSelector CSS selector for the text element
 * @param {Function}    applyStylesFn   Function to apply test styles
 * @return {number} Optimal font size
 */
export function findOptimalFontSize(
	textElement,
	elementSelector,
	applyStylesFn
) {
	if ( ! textElement ) {
		return 16;
	}

	const alreadyHasScrollableHeight =
		textElement.scrollHeight > textElement.clientHeight;
	let minSize = 5;
	let maxSize = 600;
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
 */
export function optimizeFitText( textElement, elementSelector, applyStylesFn ) {
	if ( ! textElement ) {
		return;
	}

	// Clear existing styles to measure natural size
	getOriginalFontSize( textElement, applyStylesFn );

	// Find optimal font size using binary search
	const optimalSize = findOptimalFontSize(
		textElement,
		elementSelector,
		applyStylesFn
	);

	// Generate final CSS rule
	const cssRule = generateCSSRule( elementSelector, optimalSize );

	// Apply final styles
	applyStylesFn( cssRule );
}
