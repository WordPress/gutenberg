/**
 * Appends post id the url
 *
 * @param  {string}	url   URL
 * @param  {Object}	args  Query Args
 *
 * @return {string}       Updated URL
 */
export function addQueryArgs( url, args ) {
	// reset path
	window.history.replaceState(
		{ },
		' ',
		`${ wpApiSettings.root }/pages/`
	);

	if ( args.post ) {
		return `${ args.post }/${ args.action }`;
	}

	if ( args.preview ) {
		return url;
	}

	return 'new';
}
