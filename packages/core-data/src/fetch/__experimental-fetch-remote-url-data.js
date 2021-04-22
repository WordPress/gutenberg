/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs, prependHTTP } from '@wordpress/url';

const fetchRemoteUrlData = async ( url ) => {
	const endpoint = '/__experimental/url-details';

	const args = {
		url: prependHTTP( url ),
	};

	return apiFetch( {
		path: addQueryArgs( endpoint, args ),
	} );
};

export default fetchRemoteUrlData;
