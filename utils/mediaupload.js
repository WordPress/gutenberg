import { attachCallbacks } from './promise';
import { createObjectUrl } from './url';
import { createMediaFromFile } from './media';

export function mediaUpload( filesList, tempImageCallback, uploadedImageCallback, completedCallback ) {
	// Cast filesList to array
	const files = [ ...filesList ].filter( file => /^image\//.test( file.type ) );

	tempImageCallback( files.map( createObjectUrl ) );
	const itemCallbackAdapter = ( error, result ) =>
		error ? uploadedImageCallback( error, null ) : uploadedImageCallback( null, { image: result.value, index: result.index } );

	attachCallbacks( files.map( createMediaFromFile ), itemCallbackAdapter, completedCallback );
}
