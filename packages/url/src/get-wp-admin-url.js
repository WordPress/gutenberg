/**
 * WordPress dependencies
 */
/**
 * Internal dependencies
 */
import { addQueryArgs } from './add-query-args';

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

/**
 * Sets the URL of a WPAdmin Page.
 *
 * @param {string} url URL of a WPAdmin Page
 */
export function setWPAdminURL( url ) {
	wpAdminURL = url;
}
