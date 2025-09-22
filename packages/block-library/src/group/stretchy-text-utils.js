/**
 * Shared utility functions for stretchy text functionality.
 * Uses callback-based approach for maximum code reuse between editor and frontend.
 */

/**
 * Generate CSS rules for stretchy text.
 *
 * @param {string}   containerSelector CSS selector for container
 * @param {number[]} fontRatios        Array of font ratios
 * @param {number}   baseFontSize      Base font size in pixels
 * @return {string} CSS rules string
 */
export function generateCSSRules(
	containerSelector,
	fontRatios,
	baseFontSize
) {
	let cssRules = '';
	fontRatios.forEach( ( ratio, index ) => {
		const fontSize = baseFontSize * ratio;
		const selector = `${ containerSelector } > *:nth-child(${ index + 1 })`;
		cssRules += `${ selector } { font-size: ${ fontSize }px !important; }\n`;
	} );
	return cssRules;
}

/**
 * Calculate font ratios by measuring natural CSS font sizes.
 *
 * @param {HTMLElement} containerElement The container element
 * @param {Function}    applyStylesFn    Function to apply/clear styles
 * @return {number[]} Array of font ratios relative to smallest font size
 */
export function calculateFontRatios( containerElement, applyStylesFn ) {
	const textElements = containerElement.querySelectorAll(
		'h1, h2, h3, h4, h5, h6, p, pre'
	);

	if ( textElements.length === 0 ) {
		return [];
	}

	// Clear existing stretchy styles to measure natural sizes
	applyStylesFn( '' );

	// Measure natural font sizes
	const elementSizes = [];
	let minSize = Infinity;

	textElements.forEach( ( element ) => {
		const computedStyle = window.getComputedStyle( element );
		const fontSize = parseFloat( computedStyle.fontSize );
		elementSizes.push( fontSize );
		minSize = Math.min( minSize, fontSize );
	} );

	// Calculate ratios relative to smallest font size
	return elementSizes.map( ( fontSize ) => fontSize / minSize );
}

/**
 * Find optimal font size using binary search.
 *
 * @param {HTMLElement} containerElement  The container element
 * @param {string}      containerSelector CSS selector for container
 * @param {number[]}    fontRatios        Array of font ratios
 * @param {Function}    applyStylesFn     Function to apply test styles
 * @return {number} Optimal base font size
 */
export function findOptimalFontSize(
	containerElement,
	containerSelector,
	fontRatios,
	applyStylesFn
) {
	if ( fontRatios.length === 0 ) {
		return 1;
	}

	let minSize = 1;
	let maxSize = 200;
	let bestSize = minSize;

	// Binary search for optimal base font size
	while ( minSize <= maxSize ) {
		const midSize = Math.floor( ( minSize + maxSize ) / 2 );

		// Apply test styles via callback
		const testCSS = generateCSSRules(
			containerSelector,
			fontRatios,
			midSize
		);
		applyStylesFn( testCSS );

		// Check if content fits
		const fitsWidth =
			containerElement.scrollWidth <= containerElement.clientWidth;
		const fitsHeight =
			containerElement.scrollHeight <= containerElement.clientHeight;

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
 * Complete stretchy text optimization orchestration.
 * Handles the full flow using callbacks for style management.
 *
 * @param {HTMLElement} containerElement  The container element
 * @param {string}      containerSelector CSS selector for container
 * @param {Function}    applyStylesFn     Function to apply CSS styles (pass empty string to clear)
 * @return {Object} Object with cssRules, fontRatios, and optimalSize
 */
export function optimizeStretchyText(
	containerElement,
	containerSelector,
	applyStylesFn
) {
	if ( ! containerElement ) {
		return { cssRules: '', fontRatios: [], optimalSize: 1 };
	}

	// Calculate font ratios (clears styles internally)
	const fontRatios = calculateFontRatios( containerElement, applyStylesFn );

	if ( fontRatios.length === 0 ) {
		return { cssRules: '', fontRatios: [], optimalSize: 1 };
	}

	// Find optimal font size using callbacks
	const optimalSize = findOptimalFontSize(
		containerElement,
		containerSelector,
		fontRatios,
		applyStylesFn
	);

	// Generate final CSS rules
	const cssRules = generateCSSRules(
		containerSelector,
		fontRatios,
		optimalSize
	);

	// Apply final styles
	applyStylesFn( cssRules );

	return {
		cssRules,
		fontRatios,
		optimalSize,
	};
}
