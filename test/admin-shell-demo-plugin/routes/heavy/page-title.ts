import { __, sprintf } from '@wordpress/i18n';

/**
 * Returns the title of the heavy demo page in the URL: the same route serves
 * Heavy page 1, 2 and 3.
 */
export function getHeavyPageTitle() {
	const number = new URLSearchParams( window.location.search )
		.get( 'page' )
		?.match( /heavy-(\d+)/ )?.[ 1 ];
	return number
		? /* translators: %s: number of the heavy demo page. */
			sprintf( __( 'Heavy page %s' ), number )
		: __( 'Heavy page' );
}
