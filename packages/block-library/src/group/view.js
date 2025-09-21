// Stretchy Text functionality
let dynamicStyleElement = null;

function createDynamicStyleElement() {
	if ( ! dynamicStyleElement ) {
		dynamicStyleElement = document.createElement( 'style' );
		document.head.appendChild( dynamicStyleElement );
	}
	return dynamicStyleElement;
}

function generateUniqueClass() {
	return 'stretchy-' + Math.random().toString( 36 ).substring( 2, 11 );
}

function initializeStretchyContainer( containerElement ) {
	// Generate unique class for this container
	const uniqueClass = generateUniqueClass();
	containerElement.classList.add( uniqueClass );

	// Calculate font ratios for this container
	const fontRatios = calculateFontRatios( containerElement, uniqueClass );

	// Store ratios on the container element
	containerElement._stretchyData = {
		uniqueClass,
		fontRatios,
	};

	// Initial sizing
	stretchText( containerElement );

	// Watch for container resize
	if ( window.ResizeObserver ) {
		const resizeObserver = new ResizeObserver( () => {
			stretchText( containerElement );
		} );
		resizeObserver.observe( containerElement );
	}
}

function calculateFontRatios( containerElement, uniqueClass ) {
	const textElements = containerElement.querySelectorAll(
		'h1, h2, h3, h4, h5, h6, p'
	);
	const elementSizes = [];
	let minSize = Infinity;

	// Temporarily clear any dynamic styles to get CSS values
	updateDynamicCSS( uniqueClass, [] );

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

function updateDynamicCSS( uniqueClass, fontSizes ) {
	const styleElement = createDynamicStyleElement();

	// Generate CSS rules for this container
	let cssRules = '';
	fontSizes.forEach( ( fontSize, index ) => {
		const selector = `.${ uniqueClass } > *:nth-child(${ index + 1 })`;
		cssRules += `${ selector } { font-size: ${ fontSize }px !important; }\n`;
	} );

	// Update or add rules for this container
	const existingContent = styleElement.textContent || '';
	const classPattern = new RegExp( `\\.${ uniqueClass }[^}]*}`, 'g' );
	const newContent = existingContent.replace( classPattern, '' ) + cssRules;
	styleElement.textContent = newContent;
}

function stretchText( containerElement ) {
	const data = containerElement._stretchyData;
	if ( ! data ) {
		return;
	}

	const { uniqueClass, fontRatios } = data;

	let minSize = 1;
	let maxSize = 200;
	let bestSize = minSize;

	// Binary search for optimal base font size
	while ( minSize <= maxSize ) {
		const midSize = Math.floor( ( minSize + maxSize ) / 2 );

		// Generate font sizes for this test
		const testSizes = fontRatios.map( ( ratio ) => midSize * ratio );

		// Apply test sizes via CSS
		updateDynamicCSS( uniqueClass, testSizes );

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
	updateDynamicCSS( uniqueClass, finalSizes );
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