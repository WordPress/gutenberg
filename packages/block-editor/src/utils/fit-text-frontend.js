/**
 * Frontend fit text functionality.
 * Automatically detects and initializes fit text on blocks with the has-fit-text class.
 */

/**
 * Internal dependencies
 */
import { optimizeFitText } from './fit-text-utils';

/**
 * Get or create a unique style element for a fit text element.
 *
 * @param {string} elementId Unique identifier for the element.
 * @return {HTMLElement} Style element.
 */
function getOrCreateStyleElement( elementId ) {
	const styleId = `fit-text-${ elementId }`;
	let styleElement = document.getElementById( styleId );
	if ( ! styleElement ) {
		styleElement = document.createElement( 'style' );
		styleElement.id = styleId;
		document.head.appendChild( styleElement );
	}
	return styleElement;
}

/**
 * Generate a unique identifier for a fit text element.
 *
 * @param {HTMLElement} element The element to identify.
 * @return {string} Unique identifier.
 */
function getElementIdentifier( element ) {
	// Use existing ID or create one
	if ( ! element.dataset.fitTextId ) {
		element.dataset.fitTextId =
			// Here Math.random is ok to generate ids they don't need to cryptographically secure.
			// eslint-disable-next-line no-restricted-syntax
			'fit-text-' + Math.random().toString( 36 ).substring( 2, 11 );
	}
	return element.dataset.fitTextId;
}

/**
 * Initialize fit text functionality for a single element.
 *
 * @param {HTMLElement} element Element with fit text enabled.
 */
function initializeFitText( element ) {
	// Get unique ID for this element
	const elementId = getElementIdentifier( element );

	// Apply fit text optimization
	const applyFitText = () => {
		// Get style element for this element
		const styleElement = getOrCreateStyleElement( elementId );
		const elementSelector = `[data-fit-text-id=\"${ elementId }\"]`;

		// Style management callback
		const applyStylesFn = ( css ) => {
			styleElement.textContent = css;
		};

		// Use shared utility for complete optimization
		optimizeFitText( element, elementSelector, applyStylesFn );
	};

	// Initial sizing
	applyFitText();

	// Watch for parent container resize
	if ( window.ResizeObserver && element.parentElement ) {
		const resizeObserver = new window.ResizeObserver( applyFitText );
		resizeObserver.observe( element.parentElement );

		// Store observer for cleanup if needed
		element._fitTextObserver = resizeObserver;
	}
}

/**
 * Initialize fit text on all elements with the has-fit-text class.
 */
function initializeAllFitText() {
	const elements = document.querySelectorAll( '.has-fit-text' );
	elements.forEach( initializeFitText );
}

// Initialize on DOM content loaded
document.addEventListener( 'DOMContentLoaded', initializeAllFitText );

// Also initialize on window load for cases where DOMContentLoaded has already fired
window.addEventListener( 'load', initializeAllFitText );
