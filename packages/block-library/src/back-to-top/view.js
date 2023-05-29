/**
 * This script is loaded on the front as a fallback
 * if the classic theme does not include wp_body_open().
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
		document.querySelector( 'body a' ).focus();
	}

	backToTopBlocks.forEach( ( backToTop ) => {
		backToTop.addEventListener( 'click', moveFocusToTop );
	} );
} );
