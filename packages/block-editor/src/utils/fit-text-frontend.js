/**
 * Frontend fit text functionality.
 * Automatically detects and initializes fit text on blocks with the has-fit-text class.
 * Supports both initial page load and Interactivity API client-side navigation.
 */

/**
 * WordPress dependencies
 */
import { store, getElement, useInit } from '@wordpress/interactivity';

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
 * @return {ResizeObserver|null} The ResizeObserver instance, or null if not created.
 */
function initializeFitText( element ) {
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
		return resizeObserver;
	}

	return null;
}

// Initialize via Interactivity API for client-side navigation
store( 'core/fit-text', {
	callbacks: {
		init() {
			const { ref } = getElement();
			if ( ref && ref.classList.contains( 'has-fit-text' ) ) {
				initializeFitText( ref );
			}
		},
	},
} );
