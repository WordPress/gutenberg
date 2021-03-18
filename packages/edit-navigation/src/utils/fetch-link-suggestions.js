/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * External dependencies
 */
import { flatten, map } from 'lodash';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * Fetches link suggestions from the API. This function is an exact copy of a function found at:
 *
 * packages/editor/src/components/provider/index.js
 *
 * It seems like there is no suitable package to import this from. Ideally it would be either part of core-data.
 * Until we refactor it, just copying the code is the simplest solution.
 *
 * @param {string} search
 * @param {Object} [searchArguments]
 * @param {number} [searchArguments.isInitialSuggestions]
 * @param {number} [searchArguments.type]
 * @param {number} [searchArguments.subtype]
 * @param {Object} [editorSettings]
 * @param {boolean} [editorSettings.disablePostFormats=false]
 * @return {Promise<Object[]>} List of suggestions
 */

export default function fetchLinkSuggestions(
	search,
	{ isInitialSuggestions, type, subtype } = {},
	{ disablePostFormats = false } = {}
) {
	const perPage = isInitialSuggestions ? 3 : 20;

	const linkTypes = [ 'post', 'term', 'post-format' ];

	linkTypes.forEach( ( linkType ) => {
		if ( ! type || type === linkType ) {
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					per_page: perPage,
					type: 'post',
					subtype,
				} ),
			} ).catch( () => [] ); // fail by returning no results
		}
	} );
	const queries = [];

	if ( ! type || type === 'post' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
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
					per_page: perPage,
					type: 'post-format',
					subtype,
				} ),
			} ).catch( () => [] )
		);
	}

	return Promise.all( queries ).then( ( results ) => {
		return map( flatten( results ).slice( 0, perPage ), ( result ) => ( {
			id: result.id,
			url: result.url,
			title: decodeEntities( result.title ) || __( '(no title)' ),
			type: result.subtype || result.type,
		} ) );
	} );
}
