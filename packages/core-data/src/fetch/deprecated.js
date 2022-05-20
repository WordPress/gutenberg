/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import fetchLinkSuggestions from './fetch-link-suggestions';

export const __experimentalFetchLinkSuggestions = ( search ) => {
	deprecated( 'wp.coreData.__experimentalFetchLinkSuggestions', {
		since: '6.1',
		alternative: 'wp.coreData.fetchLinkSuggestions',
	} );
	return fetchLinkSuggestions( search );
};
