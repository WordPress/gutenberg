( ( $ ) => {
	$.fn.test = function() {
		return this.each( function() {
			$( this ).text( 'Iframed Block (set with jQuery)' );
		} );
	};
} )( window.jQuery );
