/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

export default function useDisplayUrl( url ) {
	return useMemo( () => {
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
	}, [ url ] );
}
