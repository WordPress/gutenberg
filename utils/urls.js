/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

let wpAdminURL = '';

/**
 * Returns the URL of a WPAdmin Page.
 *
 * @param {string} page  Page to navigate to.
 * @param {Object} query Query Args.
 *
 * @return {string} WPAdmin URL.
 */
export function getWPAdminURL( page, query ) {
	const url = wpAdminURL + page;
	return addQueryArgs( url, query );
}

export function setWPAdminURL( url ) {
	wpAdminURL = url;
}
