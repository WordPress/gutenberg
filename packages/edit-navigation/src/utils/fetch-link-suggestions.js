/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
/**
 * External dependencies
 */
import { flatten, slice, map as _map, flow } from 'lodash';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

// curried map operator with flipped arguments
const map = ( mapFunction ) => ( array ) => _map( array, mapFunction );

const toSuggestionLinkObj = ( { id, url, title, subType, type } ) => ( {
	id,
	url,
	title: decodeEntities( title ) || __( '(no title)' ),
	type: subType || type,
} );
const toApiFetchBody = ( { search, subtype, perPage } ) => ( linkType ) => ( {
	path: addQueryArgs( '/wp/v2/search', {
		search,
		per_page: perPage,
		type: linkType,
		subtype,
	} ),
} );
// eslint-disable-next-line no-console
const exceptionHandler = ( e ) => ( console.error( e ), [] );
const getAllLinkTypes = ( disablePostFormats ) => {
	const baseLinkTypes = [ 'post', 'term' ];
	return disablePostFormats
		? baseLinkTypes
		: [ ...baseLinkTypes, 'post-format' ];
};
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
export default (
	search,
	{ isInitialSuggestions, type, subtype } = {},
	{ disablePostFormats = false } = {}
) => {
	const perPage = isInitialSuggestions ? 3 : 20;
	const typesOfLinksToFetch = type
		? [ type ]
		: getAllLinkTypes( disablePostFormats );

	// assign piped functions producing api call
	const toReqBody = flow( [
		toApiFetchBody( { search, subtype, perPage } ),
		apiFetch,
		( promise ) => promise.catch( exceptionHandler ),
	] );

	// assign piped functions producing suggestion links objects from server response data
	const toSuggestionLinksObjects = flow( [
		flatten,
		( x ) => slice( x, 0, perPage ),
		toSuggestionLinkObj,
	] );

	// for each link type, build transformations describing how to make a call to API and then format response
	const fromLinkTypeToSuggestionLinksObjects = map(
		[ toReqBody, async ( x ) => await x, toSuggestionLinksObjects ],
		map
	);

	return flow( fromLinkTypeToSuggestionLinksObjects )( typesOfLinksToFetch );
};
