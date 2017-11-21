import { flowRight } from 'lodash';

import { attachCallbacks, fromJqueryPromise } from './promise';
import { createObjectUrl } from './url';

export function mediaUpload( filesList, tempImageCallback, uploadedImageCallback, completedCallback ) {
	// Cast filesList to array
	const files = [ ...filesList ].filter( file => /^image\//.test( file.type ) );

	tempImageCallback( files.map( createObjectUrl ) );
	const itemCallbackAdapter = ( error, result ) =>
		error ? uploadedImageCallback( error, null ) : uploadedImageCallback( null, { image: result.value, index: result.index } );

	const createUploadPromise = flowRight( fromJqueryPromise, createMediaFromFile );
	attachCallbacks( files.map( createUploadPromise ), itemCallbackAdapter, completedCallback );
}

/**
 * @param  {File}    file Media File to Save
 * @return {Promise}      Media Object Promise
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
