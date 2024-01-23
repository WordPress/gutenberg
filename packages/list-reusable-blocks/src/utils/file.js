/**
 * Reads the textual content of the given file.
 *
 * @param {File} file File.
 * @return {Promise<string>}  Content of the file.
 */
export function readTextFile( file ) {
	const reader = new window.FileReader();
	return new Promise( ( resolve ) => {
		reader.onload = () => {
			resolve( reader.result );
		};
		reader.readAsText( file );
	} );
}
