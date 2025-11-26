/**
 * Shared utility functions for fit text functionality.
 * Uses callback-based approach for maximum code reuse between editor and frontend.
 */

/**
 * Find optimal font size using simple binary search between 5-600px.
 *
 * @param {HTMLElement} textElement   The text element
 * @param {Function}    applyFontSize Function that receives font size in pixels
 * @return {number} Optimal font size
 */
function findOptimalFontSize( textElement, applyFontSize ) {
	const computedStyle = window.getComputedStyle( textElement );
	const paddingLeft = parseFloat( computedStyle.paddingLeft ) || 0;
	const paddingRight = parseFloat( computedStyle.paddingRight ) || 0;
	const range = document.createRange();
	range.selectNodeContents( textElement );

	const currentFontSize = parseFloat( computedStyle.fontSize ) || 16;
	const currentWidth = range.getBoundingClientRect().width;
	range.detach();

	const availableWidth = textElement.clientWidth - paddingLeft - paddingRight;

	// Estimate optimal size by scaling proportionally.
	// If text at currentFontSize takes currentWidth, then to fit availableWidth:
	// optimalSize ≈ currentFontSize * (availableWidth / currentWidth)
	const estimatedSize = Math.floor(
		currentFontSize * ( availableWidth / currentWidth )
	);

	applyFontSize( estimatedSize );

	return estimatedSize;
}

/**
 * Complete fit text optimization for a single text element.
 * Handles the full flow using callbacks for font size application.
 *
 * @param {HTMLElement} textElement   The text element (paragraph, heading, etc.)
 * @param {Function}    applyFontSize Function that receives font size in pixels (0 to clear, >0 to apply)
 */
export function optimizeFitText( textElement, applyFontSize ) {
	if ( ! textElement ) {
		return;
	}

	applyFontSize( 0 );

	const optimalSize = findOptimalFontSize( textElement, applyFontSize );

	applyFontSize( optimalSize );
	return optimalSize;
}
