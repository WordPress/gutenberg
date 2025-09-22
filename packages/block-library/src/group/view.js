// Stretchy Text functionality
/**
 * Internal dependencies
 */
import { optimizeStretchyText } from './stretchy-text-utils';

function getOrCreateStyleElement( containerId ) {
	const styleId = `stretchy-text-${ containerId }`;
	let styleElement = document.getElementById( styleId );
	if ( ! styleElement ) {
		styleElement = document.createElement( 'style' );
		styleElement.id = styleId;
		document.head.appendChild( styleElement );
	}
	return styleElement;
}

function getContainerIdentifier( containerElement ) {
	// Use existing ID or create one
	if ( ! containerElement.dataset.stretchyId ) {
		containerElement.dataset.stretchyId =
			// Here Math.random is ok to generate ids they don't need to cryptographically secure.
			// eslint-disable-next-line no-restricted-syntax
			'container-' + Math.random().toString( 36 ).substring( 2, 11 );
	}
	return containerElement.dataset.stretchyId;
}

function initializeStretchyContainer( containerElement ) {
	// Get unique ID for this container
	const containerId = getContainerIdentifier( containerElement );

	// Initial sizing
	stretchText( containerElement, containerId );

	// Watch for container resize
	if ( window.ResizeObserver ) {
		const resizeObserver = new window.ResizeObserver( () => {
			stretchText( containerElement, containerId );
		} );
		resizeObserver.observe( containerElement );
	}
}

function stretchText( containerElement, containerId ) {
	// Get style element for this container
	const styleElement = getOrCreateStyleElement( containerId );
	const containerSelector = `[data-stretchy-id="${ containerId }"]`;

	// Style management callbacks
	const applyStylesFn = ( css ) => {
		styleElement.textContent = css;
	};
	const clearStylesFn = () => {
		styleElement.textContent = '';
	};

	// Use shared utility for complete optimization
	optimizeStretchyText(
		containerElement,
		containerSelector,
		applyStylesFn,
		clearStylesFn
	);
}

// Initialize all stretchy text containers when DOM is loaded
document.addEventListener( 'DOMContentLoaded', function () {
	const containers = document.querySelectorAll(
		'.wp-block-group.has-stretch-text'
	);
	containers.forEach( initializeStretchyContainer );
} );

// Also initialize on window load for cases where DOMContentLoaded has already fired
window.addEventListener( 'load', function () {
	const containers = document.querySelectorAll(
		'.wp-block-group.has-stretch-text'
	);
	containers.forEach( initializeStretchyContainer );
} );
