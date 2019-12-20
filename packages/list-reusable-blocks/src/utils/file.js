/**
 * Downloads a file.
 *
 * @param {string} fileName    File Name.
 * @param {string} content     File Content.
 * @param {string} contentType File mime type.
 */
export function download( fileName, content, contentType ) {
	const file = new window.Blob( [ content ], { type: contentType } );

	// IE11 can't use the click to download technique
	// we use a specific IE11 technique instead.
	if ( window.navigator.msSaveOrOpenBlob ) {
		window.navigator.msSaveOrOpenBlob( file, fileName );
	} else {
		const a = document.createElement( 'a' );
		a.href = URL.createObjectURL( file );
		a.download = fileName;

		a.style.display = 'none';
		document.body.appendChild( a );
		a.click();
		document.body.removeChild( a );
	}
}

/**
 * Reads the textual content of the given file.
 *
 * @param  {File} file        File.
 * @return {Promise<string>}  Content of the file.
 */
export function readTextFile( file ) {
	const reader = new window.FileReader();
	return new Promise( ( resolve ) => {
		reader.onload = function() {
			resolve( reader.result );
		};
		reader.readAsText( file );
	} );
}
