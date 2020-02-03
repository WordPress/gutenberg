/**
 * External dependencies
 */
import { parse, resolve } from 'url';

/**
 * Return `true` if the given path is http/https.
 *
 * @param  {string}  filePath path
 *
 * @return {boolean} is remote path.
 */
function isRemotePath( filePath ) {
	return /^(?:https?:)?\/\//.test( filePath );
}

/**
 * Return `true` if the given filePath is an absolute url.
 *
 * @param  {string}  filePath path
 *
 * @return {boolean} is absolute path.
 */
function isAbsolutePath( filePath ) {
	return /^\/(?!\/)/.test( filePath );
}

/**
 * Whether or not the url should be inluded.
 *
 * @param  {Object} meta url meta info
 *
 * @return {boolean} is valid.
 */
function isValidURL( meta ) {
	// ignore hashes or data uris
	if (
		meta.value.indexOf( 'data:' ) === 0 ||
		meta.value.indexOf( '#' ) === 0
	) {
		return false;
	}

	if ( isAbsolutePath( meta.value ) ) {
		return false;
	}

	// do not handle the http/https urls if `includeRemote` is false
	if ( isRemotePath( meta.value ) ) {
		return false;
	}

	return true;
}

/**
 * Get the absolute path of the url, relative to the basePath
 *
 * @param  {string} str          the url
 * @param  {string} baseURL      base URL
 *
 * @return {string}              the full path to the file
 */
function getResourcePath( str, baseURL ) {
	const pathname = parse( str ).pathname;
	const filePath = resolve( baseURL, pathname );

	return filePath;
}

/**
 * Process the single `url()` pattern
 *
 * @param  {string} baseURL  the base URL for relative URLs
 * @return {Promise}         the Promise
 */
function processURL( baseURL ) {
	return function( meta ) {
		const URL = getResourcePath( meta.value, baseURL );
		return {
			...meta,
			newUrl:
				'url(' +
				meta.before +
				meta.quote +
				URL +
				meta.quote +
				meta.after +
				')',
		};
	};
}

/**
 * Get all `url()`s, and return the meta info
 *
 * @param  {string} value decl.value
 *
 * @return {Array}        the urls
 */
function getURLs( value ) {
	const reg = /url\((\s*)(['"]?)(.+?)\2(\s*)\)/g;
	let match;
	const URLs = [];

	while ( ( match = reg.exec( value ) ) !== null ) {
		const meta = {
			source: match[ 0 ],
			before: match[ 1 ],
			quote: match[ 2 ],
			value: match[ 3 ],
			after: match[ 4 ],
		};
		if ( isValidURL( meta ) ) {
			URLs.push( meta );
		}
	}
	return URLs;
}

/**
 * Replace the raw value's `url()` segment to the new value
 *
 * @param  {string} raw  the raw value
 * @param  {Array}  URLs the URLs to replace
 *
 * @return {string}     the new value
 */
function replaceURLs( raw, URLs ) {
	URLs.forEach( ( item ) => {
		raw = raw.replace( item.source, item.newUrl );
	} );

	return raw;
}

const rewrite = ( rootURL ) => ( node ) => {
	if ( node.type === 'declaration' ) {
		const updatedURLs = getURLs( node.value ).map( processURL( rootURL ) );
		return {
			...node,
			value: replaceURLs( node.value, updatedURLs ),
		};
	}

	return node;
};

export default rewrite;
