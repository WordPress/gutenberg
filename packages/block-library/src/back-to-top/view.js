/**
 * This script is needed to move the focus to the first focusable element on the page.
 * It is only intended to be loaded on the front of classic themes that does not include wp_body_open().
 */
window.addEventListener( 'load', () => {
	const backToTopBlocks = document.querySelectorAll(
		'.wp-block-back-to-top'
	);
	function moveFocusToTop() {
		const topAnchor = document.getElementById( '#wp-back-to-top' );
		if ( topAnchor ) {
			topAnchor.querySelector( 'a' ).focus();
			return;
		}
		// This list is not exhaustive, but covers common elements that can recieve focus.
		const focusable = [
			'a[href]',
			'audio',
			'button:not([disabled])',
			'[contenteditable]',
			'details',
			'embed',
			'iframe',
			'input:not([disabled]):not([type="hidden"])',
			'object',
			'[role="button"][tabindex="0"]',
			'[role="link"][tabindex="0"]',
			'select:not([disabled])',
			'summary',
			'textarea:not([disabled])',
			'video',
			'[tabindex]:not([tabindex="-1"])',
		];
		document.querySelector( focusable.join( ', ' ) ).focus();
	}

	backToTopBlocks.forEach( ( backToTop ) => {
		backToTop.addEventListener( 'click', moveFocusToTop );
	} );
} );
