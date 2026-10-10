import { camelCase } from 'change-case';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export { default as __experimentalFetchLinkSuggestions } from './__experimental-fetch-link-suggestions';
export { default as __experimentalFetchUrlData } from './__experimental-fetch-url-data';

export async function fetchBlockPatterns( query = {} ) {
	const restPatterns = await apiFetch( {
		path: addQueryArgs( '/wp/v2/block-patterns/patterns', query ),
	} );
	if ( ! restPatterns ) {
		return [];
	}
	return restPatterns.map( ( pattern ) =>
		Object.fromEntries(
			Object.entries( pattern ).map( ( [ key, value ] ) => [
				camelCase( key ),
				value,
			] )
		)
	);
}
