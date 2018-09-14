/**
 * Downloads a file.
 *
 * @param {string} fileName    File Name.
 * @param {string} content     File Content.
 * @param {string} contentType File mime type.
 */
export function download( fileName, content, contentType ) {
	const a = document.createElement( 'a' );
	const file = new window.Blob( [ content ], { type: contentType } );
	a.href = URL.createObjectURL( file );
	a.download = fileName;
	a.click();
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
