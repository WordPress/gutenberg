( ( win ) => {
	const { Masonry, document } = win;
	win.addEventListener( 'DOMContentLoaded', () => {
		document
			.querySelectorAll( '.wp-block-test-iframed-masonry-block' )
			.forEach( ( element ) => {
				new Masonry( element, {
					itemSelector: '.grid-item',
				} );
			} );
	} );
} )( window );
