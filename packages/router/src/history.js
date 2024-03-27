/**
 * External dependencies
 */
import { createBrowserHistory } from 'history';

/**
 * WordPress dependencies
 */
import { buildQueryString } from '@wordpress/url';

const history = createBrowserHistory();

const originalHistoryPush = history.push;
const originalHistoryReplace = history.replace;

function buildSearch( params ) {
	const queryString = buildQueryString( params );
	return queryString.length > 0 ? '?' + queryString : queryString;
}

function push( params, state ) {
	const search = buildSearch( params );
	return originalHistoryPush.call( history, { search }, state );
}

function replace( params, state ) {
	const search = buildSearch( params );
	return originalHistoryReplace.call( history, { search }, state );
}

history.push = push;
history.replace = replace;

export default history;
