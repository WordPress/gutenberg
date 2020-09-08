export default function computeDisplayUrl( url ) {
	if ( ! url ) {
		return '';
	}

	let urlData;
	try {
		urlData = new URL( url );
	} catch ( e ) {
		return url;
	}
	let displayUrl = '';

	const siteHost = document.location.host;
	if ( urlData.host && urlData.host !== siteHost ) {
		displayUrl += urlData.host;
	}
	displayUrl += urlData.pathname;
	if ( urlData.search ) {
		displayUrl += urlData.search;
	}
	return displayUrl;
}
