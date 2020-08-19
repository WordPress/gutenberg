/**
 * WordPress dependencies
 */
import { fetchRequest } from '@wordpress/react-native-bridge';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';

const setTimeoutPromise = ( delay ) =>
	new Promise( ( resolve ) => setTimeout( resolve, delay ) );

const createFetchHandler = ( supportedPathPatterns ) => {
	const fetchHandler = ( { path }, retries = 20, retryCount = 1 ) => {
		if ( ! isPathSupported( path, supportedPathPatterns ) ) {
			return Promise.reject( `Unsupported path: ${ path }` );
		}

		const responsePromise = fetchRequest( path );

		const parseResponse = ( response ) => {
			if ( typeof response === 'string' ) {
				response = JSON.parse( response );
			}
			return response;
		};

		return responsePromise.then( parseResponse ).catch( ( error ) => {
			// eslint-disable-next-line no-console
			console.warn( 'Network Error: ', JSON.stringify( error, null, 2 ) );
			if ( error.code >= 400 && error.code < 600 ) {
				return error;
			} else if ( retries === 0 ) {
				return Promise.reject( error );
			}
			return setTimeoutPromise( 1000 * retryCount ).then( () =>
				fetchHandler( { path }, retries - 1, retryCount + 1 )
			);
		} );
	};
	return fetchHandler;
};

const defaultSupportedPathPatterns = [ /wp\/v2\/(media|categories)\/?\d*?.*/i ];

export const isPathSupported = (
	path,
	supportedPathPatterns = defaultSupportedPathPatterns
) => supportedPathPatterns.some( ( pattern ) => pattern.test( path ) );

export default () => {
	const supportedPathPatterns = applyFilters(
		'native.supported_api_fetch_path_patterns',
		defaultSupportedPathPatterns
	);

	const fetchHandler = createFetchHandler( supportedPathPatterns );

	apiFetch.setFetchHandler( ( options ) => fetchHandler( options ) );
};
