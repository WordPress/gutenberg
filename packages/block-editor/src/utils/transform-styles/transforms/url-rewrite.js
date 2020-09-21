/**
 * External dependencies
 */
import { URL } from 'whatwg-url';

const rewrite = ( rootURL ) => ( node ) => {
	if ( node.type !== 'Url' ) return;

	const urlValue = node.value;
	let urlValueStr = urlValue.value;
	let urlQuote = '';
	if ( urlValue.type === 'String' ) {
		// String type nodes have the value always wrapped in quotes (like `'` or `"`)
		const urlValueStrQuoted = urlValue.value;
		urlQuote = urlValueStrQuoted.charAt( 0 );
		urlValueStr = trimOutmostChars( urlValueStrQuoted );
	}

	// bases relative URLs with rootURL
	const basedUrl = new URL( urlValueStr, rootURL );

	// skip host-relative, already normalized URLs (e.g. `/images/image.jpg`, without `..`s)
	if ( basedUrl.pathname === urlValueStr ) return;

	// wraps URL in the originally used quotes (if used)
	urlValue.value = urlQuote + basedUrl.toString() + urlQuote;
};

const trimOutmostChars = ( str ) => {
	return str.slice( 1, -1 );
};

export default rewrite;
