// Edited for WordPress
(function() {
	var baseURL;

	// Get base where the tinymce script is located
	var scripts = document.getElementsByTagName('script');
	for ( var i = 0; i < scripts.length; i++ ) {
		var src = scripts[i].src;

		if ( /tinymce_loader\.js/.test( src ) ) {
			baseURL = src.substring( 0, src.indexOf('/tests/qunit/') );
			break;
		}
	}

	document.write('<script src="' + baseURL + '/src/wp-includes/js/tinymce/tinymce.min.js"></script>');
})();
