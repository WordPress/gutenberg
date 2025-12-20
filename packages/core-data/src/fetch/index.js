/**
 * External dependencies
 */
import { camelCase } from 'change-case';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export { default as __experimentalFetchLinkSuggestions } from './__experimental-fetch-link-suggestions';
export { default as __experimentalFetchUrlData } from './__experimental-fetch-url-data';

export async function fetchBlockPatterns() {
	const restPatterns = await apiFetch( {
		path: '/wp/v2/block-patterns/patterns',
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
