/**
 * Utility functions for detecting and calculating sticky header heights.
 */

/**
 * Gets the total height of sticky Group blocks containing header template parts.
 *
 * Detection logic:
 * 1. Find all elements with position: sticky (inline style or .is-position-sticky class)
 * 2. Filter for .wp-block-group elements
 * 3. Check if the Group contains a header template part (any of):
 *    - .wp-block-template-part[data-area="header"]
 *    - .wp-block-template-part that is a <header> element
 *    - .wp-block-template-part with data-area="null" (inside sticky group at top)
 * 4. Calculate total height including margins
 *
 * @return {number} Total height in pixels of all sticky headers
 */
export function getStickyHeaderHeight() {
	// Find all elements with position: sticky
	const allElements = document.querySelectorAll( '*' );
	const stickyElements = Array.from( allElements ).filter( ( el ) => {
		const computed = window.getComputedStyle( el );
		return (
			el.style.position === 'sticky' ||
			el.classList.contains( 'is-position-sticky' ) ||
			computed.position === 'sticky'
		);
	} );

	// Filter for Group blocks only
	const stickyGroups = stickyElements.filter( ( el ) =>
		el.classList.contains( 'wp-block-group' )
	);

	// Check each Group for header template parts with improved detection
	const stickyHeaders = stickyGroups.filter( ( group ) => {
		// Check for explicit header area attribute
		const hasExplicitHeader = group.querySelector(
			'.wp-block-template-part[data-area="header"]'
		);
		if ( hasExplicitHeader ) {
			return true;
		}

		// Check for header element (semantic HTML)
		const hasHeaderElement = group.querySelector(
			'header.wp-block-template-part'
		);
		if ( hasHeaderElement ) {
			return true;
		}

		// Check for any template part in a sticky group (likely a header if sticky)
		const hasAnyTemplatePart = group.querySelector(
			'.wp-block-template-part'
		);
		if ( hasAnyTemplatePart ) {
			return true;
		}

		return false;
	} );

	if ( stickyHeaders.length === 0 ) {
		return 0;
	}

	// Calculate total height of all sticky headers
	let totalHeight = 0;
	stickyHeaders.forEach( ( header ) => {
		const rect = header.getBoundingClientRect();
		const style = window.getComputedStyle( header );
		const marginTop = parseFloat( style.marginTop ) || 0;
		const marginBottom = parseFloat( style.marginBottom ) || 0;
		totalHeight += rect.height + marginTop + marginBottom;
	} );

	return totalHeight;
}

/**
 * Updates the CSS custom property with the current sticky header height.
 */
export function updateStickyHeaderHeight() {
	const height = getStickyHeaderHeight();
	document.documentElement.style.setProperty(
		'--wp-sticky-header-height',
		`${ height }px`
	);
}

/**
 * Observes changes to sticky header height and updates the CSS custom property.
 *
 * Sets up:
 * - ResizeObserver on document.body to detect layout changes
 * - Window resize listener for viewport changes
 *
 * @return {Function} Cleanup function to disconnect observers and remove listeners
 */
export function observeStickyHeaderHeight() {
	// Initial calculation
	updateStickyHeaderHeight();

	// Set up ResizeObserver to detect when elements are added/removed or resized
	// eslint-disable-next-line no-undef
	const resizeObserver = new ResizeObserver( () => {
		updateStickyHeaderHeight();
	} );
	resizeObserver.observe( document.body );

	// Also listen for window resize events
	const handleResize = () => {
		updateStickyHeaderHeight();
	};
	window.addEventListener( 'resize', handleResize );

	// Return cleanup function
	return () => {
		resizeObserver.disconnect();
		window.removeEventListener( 'resize', handleResize );
	};
}
