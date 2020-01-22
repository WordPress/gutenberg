/**
 * WordPress dependencies
 */
import { prependHTTP, getProtocol, isEmail } from '@wordpress/url';

/**
 * Given an input value assumed to be interpreted as a URL, returns a suggestion
 * value representing that URL. The suggestion will always assign a `type` of
 * `'url'`, an ID and URL corresponding to the given input value, and an empty
 * title. The subtype will be inferred based on an interpretation of the URL,
 * one of: `'fragment'`, `'query'`, `'path'`, or the scheme of the URL.
 *
 * @param {string} url Input value.
 *
 * @return {WPLinkControlSuggestion} URL suggestion.
 */
function getSuggestionByURL( url ) {
	if ( isEmail( url ) ) {
		url = 'mailto:' + url;
	}

	url = prependHTTP( url );

	let subtype;
	if ( url[ 0 ] === '#' ) {
		subtype = 'fragment';
	} else if ( url[ 0 ] === '?' ) {
		subtype = 'query';
	} else if ( url[ 0 ] === '/' || url[ 0 ] === '.' ) {
		subtype = 'path';
	} else {
		const protocol = getProtocol( url );
		subtype = protocol.replace( /:$/, '' );
	}

	return {
		id: url,
		title: '',
		type: 'url',
		subtype,
		url,
	};
}

export default getSuggestionByURL;
