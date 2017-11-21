import { fromJqueryPromise } from './promise';

/**
 * @param  {File}    file Media File to Save
 * @return {Promise}      Media Object Promise
 */
export function createMediaFromFile( file ) {
	// Create upload payload
	const data = new window.FormData();
	data.append( 'file', file, file.name || file.type.replace( '/', '.' ) );

	return fromJqueryPromise( new wp.api.models.Media().save( null, {
		data: data,
		contentType: false,
	} ) );
}
