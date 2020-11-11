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
