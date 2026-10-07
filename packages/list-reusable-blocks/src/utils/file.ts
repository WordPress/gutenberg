/**
 * Reads the textual content of the given file.
 *
 * @param file - File to read
 * @return Promise that resolves to the content of the file
 */
export function readTextFile( file: File ): Promise< string > {
	const reader = new window.FileReader();
	return new Promise( ( resolve ) => {
		reader.onload = () => {
			resolve( reader.result as string );
		};
		reader.readAsText( file );
	} );
}
