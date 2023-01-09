/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export default async function fetchEntities(
	url,
	query = {},
	abortController
) {
	return apiFetch( {
		path: addQueryArgs( url, query ),
		signal: abortController?.current?.signal,
	} );
}
