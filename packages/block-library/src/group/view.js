// Stretchy Text functionality

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

	// Calculate font ratios for this container
	const fontRatios = calculateFontRatios( containerElement, containerId );

	// Store ratios on the container element
	containerElement._stretchyData = {
		containerId,
		fontRatios,
	};

	// Initial sizing
	stretchText( containerElement );

	// Watch for container resize
	if ( window.ResizeObserver ) {
		const resizeObserver = new window.ResizeObserver( () => {
			stretchText( containerElement );
		} );
		resizeObserver.observe( containerElement );
	}
}

function calculateFontRatios( containerElement, containerId ) {
	const textElements = containerElement.querySelectorAll(
		'h1, h2, h3, h4, h5, h6, p, pre'
	);
	const elementSizes = [];
	let minSize = Infinity;

	// Temporarily clear any dynamic styles to get CSS values
	updateContainerCSS( containerId, [] );

	textElements.forEach( ( element ) => {
		const computedStyle = window.getComputedStyle( element );
		const fontSize = parseFloat( computedStyle.fontSize );
		elementSizes.push( fontSize );
		minSize = Math.min( minSize, fontSize );
	} );

	// Calculate ratios relative to smallest font size
	const fontRatios = elementSizes.map( ( fontSize ) => fontSize / minSize );

	return fontRatios;
}

function updateContainerCSS( containerId, fontSizes ) {
	const styleElement = getOrCreateStyleElement( containerId );
	const containerSelector = `[data-stretchy-id="${ containerId }"]`;

	// Generate CSS rules for this container
	let cssRules = '';
	fontSizes.forEach( ( fontSize, index ) => {
		const selector = `${ containerSelector } > *:nth-child(${ index + 1 })`;
		cssRules += `${ selector } { font-size: ${ fontSize }px !important; }\n`;
	} );

	// Direct assignment - no string manipulation needed
	styleElement.textContent = cssRules;
}

function stretchText( containerElement ) {
	const data = containerElement._stretchyData;
	if ( ! data ) {
		return;
	}

	const { containerId, fontRatios } = data;

	let minSize = 1;
	let maxSize = 200;
	let bestSize = minSize;

	// Binary search for optimal base font size
	while ( minSize <= maxSize ) {
		const midSize = Math.floor( ( minSize + maxSize ) / 2 );

		// Generate font sizes for this test
		const testSizes = fontRatios.map( ( ratio ) => midSize * ratio );

		// Apply test sizes via CSS
		updateContainerCSS( containerId, testSizes );

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

	// Apply final optimal sizes
	const finalSizes = fontRatios.map( ( ratio ) => bestSize * ratio );
	updateContainerCSS( containerId, finalSizes );
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
	containers.forEach( ( container ) => {
		if ( ! container._stretchyData ) {
			initializeStretchyContainer( container );
		}
	} );
} );
