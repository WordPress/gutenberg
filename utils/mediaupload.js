/**
 * External Dependencies
 */
import { compact } from 'lodash';

/**
 *	Media Upload is used by image and gallery blocks to handle uploading an image.
 *	when a file upload button is activated.
 *
 *	TODO: future enhancement to add an upload indicator.
 *
 * @param {Array}    filesList      List of files.
 * @param {Function} onImagesChange Function to be called each time a file or a temporary representation of the file is available.
 */
export function mediaUpload( filesList, onImagesChange ) {
	// Cast filesList to array
	const files = [ ...filesList ];

	const imagesSet = [];
	const setAndUpdateImages = ( idx, value ) => {
		imagesSet[ idx ] = value;
		onImagesChange( compact( imagesSet ) );
	};
	files.forEach( ( mediaFile, idx ) => {
		// Only allow image uploads, may need updating if used for video
		if ( ! /^image\//.test( mediaFile.type ) ) {
			return;
		}

		// Set temporary URL to create placeholder image, this is replaced
		// with final image from media gallery when upload is `done` below
		imagesSet.push( { url: window.URL.createObjectURL( mediaFile ) } );
		onImagesChange( imagesSet );

		return createMediaFromFile( mediaFile ).then(
			( savedMedia ) => {
				setAndUpdateImages( idx, { id: savedMedia.id, url: savedMedia.source_url, link: savedMedia.link } );
			},
			() => {
				// Reset to empty on failure.
				// TODO: Better failure messaging
				setAndUpdateImages( idx, null );
			}
		);
	} );
}

/**
 * @param {File} file Media File to Save.
 *
 * @return {Promise} Media Object Promise.
 */
export function createMediaFromFile( file ) {
	// Create upload payload
	const data = new window.FormData();
	data.append( 'file', file, file.name || file.type.replace( '/', '.' ) );

	return new wp.api.models.Media().save( null, {
		data: data,
		contentType: false,
	} );
}

/**
 * Utility used to preload an image before displaying it.
 *
 * @param   {string}  url Image Url.
 * @return {Promise}     Pormise resolved once the image is preloaded.
 */
export function preloadImage( url ) {
	return new Promise( resolve => {
		const newImg = new window.Image();
		newImg.onload = function() {
			resolve( url );
		};
		newImg.src = url;
	} );
}
