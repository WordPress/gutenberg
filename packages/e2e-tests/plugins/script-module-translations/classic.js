/**
 * Classic script that imports a script module once the page has loaded, as
 * real code does: by then the import map and the script module translations
 * are printed.
 */
( function () {
	document.addEventListener( 'DOMContentLoaded', function () {
		// eslint-disable-next-line import/no-unresolved -- The import map resolves the script module ID.
		import( 'gutenberg-test-script-module-translations-imported' ).then(
			function ( module ) {
				module.render(
					document.getElementById(
						'gutenberg-test-script-module-translations-imported'
					)
				);
			}
		);
	} );
} )();
