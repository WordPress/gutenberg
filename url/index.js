/**
 * Appends post id the url
 *
 * @param  {String} url   URL
 * @param  {Object} args  Query Args
 *
 * @return {String}       Updated URL
 */
export function addQueryArgs( url, args ) {
	// reset path
	window.history.replaceState(
		{ },
		' ',
		`${wpApiSettings.root}/pages/`
	); 

	if (args.post) {
		return `${args.post}/${args.action}`;
	}

	if (args.preview) {
		return url;
	}

	return 'new';
}