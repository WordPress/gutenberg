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

function push( params, state ) {
	const search = buildQueryString( params );
	return originalHistoryPush.call( history, { search }, state );
}

function replace( params, state ) {
	const search = buildQueryString( params );
	return originalHistoryReplace.call( history, { search }, state );
}

history.push = push;
history.replace = replace;

export default history;
