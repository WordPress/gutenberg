window.wp = window.wp || {};
window.wp.filePicker = ( function() {
	return function( multiple, accept ) {
		return new Promise( function( resolve, reject ) {
			var input = document.createElement( 'input' );

			input.type = 'file';
			input.accept = accept;
			input.multiple = multiple;
			input.style.position = 'fixed';
			input.style.left = 0;
			input.style.top = 0;
			input.style.opacity = 0.001;

			input.onchange = function( event ) {
				resolve( event.target.files );
				input.parentNode.removeChild( input );
			}

			document.body.appendChild( input );

			input.click();
		} );
	}
} )();
