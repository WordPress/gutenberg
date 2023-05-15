window.addEventListener( 'load', () => {
	const backToTopBlocks = document.querySelectorAll(
		'.wp-block-back-to-top'
	);
	function moveFocusToTop() {
		const topAnchor = document.getElementById( 'top' );
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
