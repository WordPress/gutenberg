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
	if (
		element.dataset.fitTextId &&
		resizeObservers.has( element.dataset.fitTextId )
	) {
		return;
	}

	if ( element.dataset.fitTextId ) {
		delete element.dataset.fitTextId;
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
	const styleElement = document.getElementById( `fit-text-${ elementId }` );
	if ( styleElement ) {
		styleElement.remove();
	}

	const observer = resizeObservers.get( elementId );
	if ( observer ) {
		observer.disconnect();
		resizeObservers.delete( elementId );
	}
}

window.addEventListener( 'load', initializeAllFitText );

// Watch for dynamically added/removed fit-text elements (e.g., from Interactivity API navigation)
if ( window.MutationObserver ) {
	const observer = new window.MutationObserver( ( mutations ) => {
		for ( const mutation of mutations ) {
			if ( mutation.removedNodes.length > 0 ) {
				for ( const node of mutation.removedNodes ) {
					if ( node.nodeType !== 1 ) {
						continue;
					}

					if ( node.dataset?.fitTextId ) {
						cleanupFitText( node.dataset.fitTextId );
					}

					const removedFitTextElements = node.querySelectorAll?.(
						'.has-fit-text[data-fit-text-id]'
					);
					if ( removedFitTextElements?.length > 0 ) {
						removedFitTextElements.forEach( ( el ) => {
							cleanupFitText( el.dataset.fitTextId );
						} );
					}
				}
			}

			if ( mutation.addedNodes.length > 0 ) {
				for ( const node of mutation.addedNodes ) {
					if ( node.nodeType !== 1 ) {
						continue;
					}

					if ( node.classList?.contains( 'has-fit-text' ) ) {
						initializeFitText( node );
					}

					const fitTextElements =
						node.querySelectorAll?.( '.has-fit-text' );
					if ( fitTextElements?.length > 0 ) {
						fitTextElements.forEach( initializeFitText );
					}
				}
			}
		}
	} );

	window.addEventListener( 'load', () => {
		observer.observe( document.body, {
			childList: true,
			subtree: true,
		} );
	} );
}
