/**
 * External Dependencies
 */
import { compact, forEach, get, startsWith } from 'lodash';

/**
 *	Media Upload is used by audio, image, gallery and video blocks to handle uploading a media file
 *	when a file upload button is activated.
 *
 *	TODO: future enhancement to add an upload indicator.
 *
 * @param {Array}    filesList      List of files.
 * @param {Function} onFileChange   Function to be called each time a file or a temporary representation of the file is available.
 * @param {string}   allowedType    The type of media that can be uploaded.
 * @param {?Object}  additionalData Additional data to include in the request.
 */
export function mediaUpload( filesList, onFileChange, allowedType, additionalData = {} ) {
	// Cast filesList to array
	const files = [ ...filesList ];

	const filesSet = [];
	const setAndUpdateFiles = ( idx, value ) => {
		filesSet[ idx ] = value;
		onFileChange( compact( filesSet ) );
	};
	const isAllowedType = ( fileType ) => startsWith( fileType, `${ allowedType }/` );
	files.forEach( ( mediaFile, idx ) => {
		if ( ! isAllowedType( mediaFile.type ) ) {
			return;
		}

		// Set temporary URL to create placeholder media file, this is replaced
		// with final file from media gallery when upload is `done` below
		filesSet.push( { url: window.URL.createObjectURL( mediaFile ) } );
		onFileChange( filesSet );

		return createMediaFromFile( mediaFile, additionalData ).then(
			( savedMedia ) => {
				const mediaObject = {
					id: savedMedia.id,
					url: savedMedia.source_url,
					link: savedMedia.link,
				};
				const caption = get( savedMedia, [ 'caption', 'raw' ] );
				if ( caption ) {
					mediaObject.caption = [ caption ];
				}
				setAndUpdateFiles( idx, mediaObject );
			},
			() => {
				// Reset to empty on failure.
				// TODO: Better failure messaging
				setAndUpdateFiles( idx, null );
			}
		);
	} );
}

/**
 * @param {File}    file           Media File to Save.
 * @param {?Object} additionalData Additional data to include in the request.
 *
 * @return {Promise} Media Object Promise.
 */
function createMediaFromFile( file, additionalData ) {
	// Create upload payload
	const data = new window.FormData();
	data.append( 'file', file, file.name || file.type.replace( '/', '.' ) );
	forEach( additionalData, ( ( value, key ) => data.append( key, value ) ) );
	return wp.apiRequest( {
		path: '/wp/v2/media',
		data,
		contentType: false,
		processData: false,
		method: 'POST',
	} );
}

/**
 * Utility used to preload an image before displaying it.
 *
 * @param   {string}  url Image Url.
 * @return {Promise}     Pormise resolved once the image is preloaded.
 */
export function preloadImage( url ) {
	return new Promise( ( resolve ) => {
		const newImg = new window.Image();
		newImg.onload = function() {
			resolve( url );
		};
		newImg.src = url;
	} );
}
