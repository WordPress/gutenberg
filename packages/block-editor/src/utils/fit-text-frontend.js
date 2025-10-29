/**
 * Frontend fit text functionality.
 * Automatically detects and initializes fit text on blocks with the has-fit-text class.
 */

/**
 * Internal dependencies
 */
import { optimizeFitText } from './fit-text-utils';

/**
 * Counter for generating unique element IDs.
 */
let idCounter = 0;

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
	if ( ! element.dataset.fitTextId ) {
		element.dataset.fitTextId = `fit-text-${ ++idCounter }`;
	}
	return element.dataset.fitTextId;
}

/**
 * Initialize fit text functionality for a single element.
 *
 * @param {HTMLElement} element Element with fit text enabled.
 */
function initializeFitText( element ) {
	// Skip if already initialized (element already has an ID)
	if ( element.dataset.fitTextId ) {
		return;
	}

	const elementId = getElementIdentifier( element );

	const applyFitText = () => {
		const styleElement = getOrCreateStyleElement( elementId );
		const elementSelector = `[data-fit-text-id=\"${ elementId }\"]`;

		// Style management callback
		const applyStylesFn = ( css ) => {
			styleElement.textContent = css;
		};

		optimizeFitText( element, elementSelector, applyStylesFn );
	};

	// Initial sizing
	applyFitText();

	// Watch for parent container resize
	if ( window.ResizeObserver && element.parentElement ) {
		const resizeObserver = new window.ResizeObserver( applyFitText );
		resizeObserver.observe( element.parentElement );
	}
}

/**
 * Initialize fit text on all elements with the has-fit-text class.
 */
function initializeAllFitText() {
	const elements = document.querySelectorAll( '.has-fit-text' );
	elements.forEach( initializeFitText );
}

// Initialize on page load
window.addEventListener( 'load', initializeAllFitText );

// Re-initialize after Interactivity API router navigation
// The router uses popstate for back/forward and renders new content into router regions
window.addEventListener( 'popstate', () => {
	// Small delay to let the router finish rendering
	setTimeout( initializeAllFitText, 100 );
} );

// Watch for DOM changes in router regions to catch client-side navigation
if ( window.MutationObserver ) {
	const observer = new window.MutationObserver( ( mutations ) => {
		// Check if any mutations affected elements with router region attributes
		const hasRouterChanges = mutations.some( ( mutation ) => {
			// Check if mutation is in a router region
			if ( mutation.target.nodeType === 1 ) {
				const target = mutation.target;
				return (
					target.hasAttribute( 'data-wp-router-region' ) ||
					target.closest( '[data-wp-router-region]' )
				);
			}
			return false;
		} );

		if ( hasRouterChanges ) {
			// Debounce re-initialization
			clearTimeout( observer.timer );
			observer.timer = setTimeout( initializeAllFitText, 100 );
		}
	} );

	// Start observing after page load
	window.addEventListener( 'load', () => {
		observer.observe( document.body, {
			childList: true,
			subtree: true,
		} );
	} );
}