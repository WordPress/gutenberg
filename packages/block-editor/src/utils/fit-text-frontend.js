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

// Watch for dynamically added fit-text elements (e.g., from Interactivity API navigation)
if ( window.MutationObserver ) {
	const observer = new window.MutationObserver( ( mutations ) => {
		// Only process mutations that added nodes
		for ( const mutation of mutations ) {
			if ( mutation.addedNodes.length === 0 ) {
				continue;
			}

			// Check each added node
			for ( const node of mutation.addedNodes ) {
				// Skip non-element nodes
				if ( node.nodeType !== 1 ) {
					continue;
				}

				// Check if the node itself is a fit-text element
				if (
					node.classList?.contains( 'has-fit-text' ) &&
					! node.dataset.fitTextId
				) {
					initializeFitText( node );
				}

				// Check for fit-text elements within the added node
				const fitTextElements = node.querySelectorAll?.(
					'.has-fit-text:not([data-fit-text-id])'
				);
				if ( fitTextElements?.length > 0 ) {
					fitTextElements.forEach( initializeFitText );
				}
			}
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