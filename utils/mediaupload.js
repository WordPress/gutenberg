/* mediaupload.js
	Media Upload is used by image and gallery blocks to handle uploading an image
	when a file upload button is activated.

	The gallery flag is needed since the gallery and image blocks have different
	attributes and can not simply be keyed off the number of images, since a
	single image gallery is possible

	TODO: future enhancement to add an upload indicator
*/

export function mediaUpload( filesList, setAttributes, gallery = false ) {
	// Cast filesList to array
	const files = [ ...filesList ];

	const gallerySet = [];
	files.forEach( ( mediaFile, idx ) => {
		// Only allow image uploads, may need updating if used for video
		if ( ! /^image\//.test( mediaFile.type ) ) {
			return;
		}

		// Set temporary URL to create placeholder image, this is replaced
		// with final image from media gallery when upload is `done` below
		const tempUrl = window.URL.createObjectURL( mediaFile );
		const media = { url: tempUrl };
		if ( gallery ) {
			gallerySet.push( media );
			setAttributes( { images: gallerySet } );
		} else {
			setAttributes( media );
		}

		return createMediaFromFile( mediaFile ).then(
			( savedMedia ) => {
				media.id = savedMedia.id;
				media.url = savedMedia.source_url;
				if ( gallery ) {
					setAttributes( { images: [
						...gallerySet.slice( 0, idx ),
						media,
						...gallerySet.slice( idx + 1 ),
					] } );
				} else {
					setAttributes( media );
				}
			},
			() => {
				// Reset to empty on failure.
				// TODO: Better failure messaging
				media.url = null;
				if ( gallery ) {
					setAttributes( { images: [
						...gallerySet.slice( 0, idx ),
						...gallerySet.slice( idx + 1 ),
					] } );
				} else {
					setAttributes( media );
				}
			}
		);
	} );
}

/**
 * @param  {File}    file Media File to Save
 * @return {Promise}      Media Object Promise
 */
export function createMediaFromFile( file ) {
	// Create upload payload
	const data = new window.FormData();
	data.append( 'file', file );

	return new wp.api.models.Media().save( null, {
		data: data,
		contentType: false,
	} );
}
