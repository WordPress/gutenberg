export function filePasteHandler( files ) {
	return files.map( ( url ) => `<img src="${ url }">` ).join( '' );
}
