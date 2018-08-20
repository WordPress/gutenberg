/**
 * External dependencies
 */
import postcss from 'postcss';
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
function isValidUrl( meta ) {
	// ignore hashes or data uris
	if ( meta.value.indexOf( 'data:' ) === 0 || meta.value.indexOf( '#' ) === 0 ) {
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
 * Get all `url()`s, and return the meta info
 *
 * @param  {string} value decl.value
 *
 * @return {Array}        the urls
 */
function getUrls( value ) {
	const reg = /url\((\s*)(['"]?)(.+?)\2(\s*)\)/g;
	let match;
	const urls = [];

	while ( ( match = reg.exec( value ) ) !== null ) {
		const meta = {
			source: match[ 0 ],
			before: match[ 1 ],
			quote: match[ 2 ],
			value: match[ 3 ],
			after: match[ 4 ],
		};
		if ( isValidUrl( meta ) ) {
			urls.push( meta );
		}
	}
	return urls;
}

/**
 * Get the absolute path of the url, relative to the basePath
 *
 * @param  {string} str          the url
 * @param  {string} baseURL      base URL
 * @param  {string} absolutePath the absolute path
 *
 * @return {string}              the full path to the file
 */
function getResourcePath( str, baseURL ) {
	const pathname = parse( str ).pathname;
	const filePath = resolve( baseURL, pathname );

	return Promise.resolve( filePath );
}

/**
 * Generate a url() creator based on the url meta info and the options.
 * The creator receive a hash as its parameter
 *
 * @param  {Object} meta - the url meta info
 * @param  {Object} opts - the options
 * @return {Function}    - the url creator
 */
function createUrl( meta ) {
	return function( url ) {
		return 'url(' +
            meta.before +
            meta.quote +
            url +
            meta.quote +
            meta.after +
        ')';
	};
}

/**
 * Process the single `url()` pattern
 *
 * @param  {string} baseURL  the base URL for relative URLs
 * @return {Promise}         the Promise
 */
function processUrl( baseURL ) {
	return function( meta ) {
		return getResourcePath( meta.value, baseURL )
			.then( createUrl( meta ) )
			.then( ( newUrl ) => {
				meta.newUrl = newUrl;
				return meta;
			} );
	};
}

/**
 * Replace the raw value's `url()` segment to the new value
 *
 * @param  {string} raw the raw value
 *
 * @return {string}     the new value
 */
function repalceUrls( raw ) {
	return function( urls ) {
		urls.forEach( ( item ) => {
			raw = raw.replace( item.source, item.newUrl );
		} );

		return raw;
	};
}

/**
 * The error handler
 *
 * @param  {Object} result the postcss result object
 * @param  {Object} decl   the postcss declaration
 *
 * @return {Function}      the error handler
 */
function handleError( result, decl ) {
	return function( err ) {
		result.warn( err.message || err, { node: decl } );
	};
}

/**
 * Process one declaration
 *
 * @param  {Object} result - the postcss result object
 * @param  {Object} decl   - the postcss declaration
 * @param  {Object} opts   - the plugin options
 *
 * @return {Promise}       - the Promise
 */
function processDecl( result, decl, opts ) {
	const actions = getUrls( decl.value ).map( processUrl( opts.baseURL ) );

	return Promise.all( actions )
		.then( repalceUrls( decl.value ) )
		.then( ( newValue ) => {
			decl.value = newValue;
		} )
		.catch( handleError( result, decl ) );
}

export default postcss.plugin( 'postcss-url', ( opts ) => {
	return ( css, result ) => {
		const actions = [];
		css.walkDecls( ( decl ) => {
			if ( decl.value && decl.value.indexOf( 'url(' ) > -1 ) {
				actions.push( processDecl( result, decl, opts ) );
			}
		} );

		return Promise.all( actions );
	};
} );
