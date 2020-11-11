/**
 * Gets all files from a DataTransfer object.
 *
 * @param {DataTransfer} dataTransfer DataTransfer object to inspect.
 *
 * @return {Set} A set containing all files.
 */
export function getFilesFromDataTransfer( dataTransfer ) {
	const files = new Set( dataTransfer.files );

	Array.from( dataTransfer.items ).forEach( ( item ) => {
		const file = item.getAsFile();

		if ( file ) {
			files.add( file );
		}
	} );

	return files;
}
