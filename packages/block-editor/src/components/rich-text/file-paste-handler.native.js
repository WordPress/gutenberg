
export function filePasteHandler( images, html ) {
	if ( ! html && images && images.length > 0 ) {
		// Allows us to ask for this information when we get a report.
		window.console.log( 'Received items:\n\n', images );
		const uploadId = Number.MAX_SAFE_INTEGER;
		let filesHTML = '';
		images.forEach( ( file ) => {
			filesHTML += `<img src="${ file }" class="wp-image-${ uploadId }">`;
		} );
		return filesHTML;
	}

	return undefined;
}
