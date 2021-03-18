/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * Fetches link suggestions from the API.
 *
 * @callback ExperimentalFetchLinkSuggestions
 * @param {string} search
 * @param {Object} [editorSettings]
 * @param {number} [searchArguments.isInitialSuggestions]
 * @param {number} [searchArguments.type]
 * @param {number} [searchArguments.subtype]
 * @param {number} [searchArguments.page]
 * @return {Promise<Object[]>} List of suggestions
 */

/**
 * Returns a function that when invoked, fetches link suggestions from the API.
 *
 * @param {Object}  [editorSettings]
 * @param {boolean} [editorSettings.disablePostFormats=false]
 *
 * @return { ExperimentalFetchLinkSuggestions } Function that fetches link suggestions
 *
 */
const createFetchLinkSuggestions = ( {
	disablePostFormats = false,
} = {} ) => async (
	search,
	{ isInitialSuggestions, type, subtype, page, perPage: perPageArg } = {}
) => {
	const perPage = perPageArg || isInitialSuggestions ? 3 : 20;

	const queries = [];

	if ( ! type || type === 'post' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'post',
					subtype,
				} ),
			} ).catch( () => [] ) // fail by returning no results
		);
	}

	if ( ! type || type === 'term' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'term',
					subtype,
				} ),
			} ).catch( () => [] )
		);
	}

	if ( ! disablePostFormats && ( ! type || type === 'post-format' ) ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'post-format',
					subtype,
				} ),
			} ).catch( () => [] )
		);
	}

	return Promise.all( queries ).then( ( results ) => {
		return results
			.reduce(
				( accumulator, current ) => accumulator.concat( current ),
				[]
			)
			.filter( ( result ) => !! result.id )
			.slice( 0, perPage )
			.map( ( result ) => ( {
				id: result.id,
				url: result.url,
				title: decodeEntities( result.title ) || __( '(no title)' ),
				type: result.subtype || result.type,
			} ) );
	} );
};

export default createFetchLinkSuggestions;
