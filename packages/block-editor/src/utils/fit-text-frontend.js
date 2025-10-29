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
 * Map to store ResizeObserver for each element, keyed by fit-text-id.
 * Allows cleanup when elements are removed.
 */
const resizeObservers = new Map();

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
		// Store observer for cleanup
		resizeObservers.set( elementId, resizeObserver );
	}
}

/**
 * Initialize fit text on all elements with the has-fit-text class.
 */
function initializeAllFitText() {
	const elements = document.querySelectorAll( '.has-fit-text' );
	elements.forEach( initializeFitText );
}

/**
 * Clean up resources for a removed fit-text element.
 *
 * @param {string} elementId The fit-text-id of the removed element.
 */
function cleanupFitText( elementId ) {
	// Remove the style element
	const styleElement = document.getElementById( `fit-text-${ elementId }` );
	if ( styleElement ) {
		styleElement.remove();
	}

	// Disconnect and remove the ResizeObserver
	const observer = resizeObservers.get( elementId );
	if ( observer ) {
		observer.disconnect();
		resizeObservers.delete( elementId );
	}
}

// Initialize on page load
window.addEventListener( 'load', initializeAllFitText );

// Watch for dynamically added/removed fit-text elements (e.g., from Interactivity API navigation)
if ( window.MutationObserver ) {
	const observer = new window.MutationObserver( ( mutations ) => {
		// Collect all added element references in this batch to detect moves vs removals
		const addedElements = new Set();
		for ( const mutation of mutations ) {
			if ( mutation.addedNodes.length > 0 ) {
				for ( const node of mutation.addedNodes ) {
					if ( node.nodeType === 1 ) {
						addedElements.add( node );
					}
				}
			}
		}

		for ( const mutation of mutations ) {
			// Handle removed nodes first (cleanup)
			if ( mutation.removedNodes.length > 0 ) {
				for ( const node of mutation.removedNodes ) {
					// Skip non-element nodes
					if ( node.nodeType !== 1 ) {
						continue;
					}

					// IMPORTANT: Only cleanup if element is NOT being re-added (i.e., truly removed)
					if ( addedElements.has( node ) ) {
						continue; // Element is being moved, not removed
					}

					// Check if removed node itself is a fit-text element
					if ( node.dataset?.fitTextId ) {
						cleanupFitText( node.dataset.fitTextId );
					}

					// Check for fit-text elements within removed node
					const removedFitTextElements = node.querySelectorAll?.(
						'.has-fit-text[data-fit-text-id]'
					);
					if ( removedFitTextElements?.length > 0 ) {
						removedFitTextElements.forEach( ( el ) => {
							// Only cleanup if not being re-added
							if ( ! addedElements.has( el ) ) {
								cleanupFitText( el.dataset.fitTextId );
							}
						} );
					}
				}
			}

			// Handle added nodes (initialization)
			if ( mutation.addedNodes.length > 0 ) {
				for ( const node of mutation.addedNodes ) {
					// Skip non-element nodes
					if ( node.nodeType !== 1 ) {
						continue;
					}

					// Check if the node itself is a fit-text element
					if ( node.classList?.contains( 'has-fit-text' ) ) {
						// If already initialized and observer exists, skip
						if (
							node.dataset.fitTextId &&
							resizeObservers.has( node.dataset.fitTextId )
						) {
							continue;
						}
						// Has ID but no observer (was cleaned up or moved), clear ID to reinit
						if ( node.dataset.fitTextId ) {
							delete node.dataset.fitTextId;
						}
						initializeFitText( node );
					}

					// Check for fit-text elements within the added node
					const fitTextElements =
						node.querySelectorAll?.( '.has-fit-text' );
					if ( fitTextElements?.length > 0 ) {
						fitTextElements.forEach( ( el ) => {
							// If already initialized and observer exists, skip
							if (
								el.dataset.fitTextId &&
								resizeObservers.has( el.dataset.fitTextId )
							) {
								return;
							}
							// Has ID but no observer, clear ID to reinit
							if ( el.dataset.fitTextId ) {
								delete el.dataset.fitTextId;
							}
							initializeFitText( el );
						} );
					}
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
