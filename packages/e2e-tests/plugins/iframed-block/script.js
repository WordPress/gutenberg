( ( win ) => {
	const { jQuery: $ } = win;
	win.addEventListener( 'DOMContentLoaded', () => {
		$( '.wp-block-test-iframed-block' ).test();
	} );
} )( window );

