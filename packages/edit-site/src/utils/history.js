/**
 * External dependencies
 */
import { createBrowserHistory } from 'history';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

const history = createBrowserHistory();

const originalHistoryPush = history.push;
const originalHistoryReplace = history.replace;

function push( params, state ) {
	return originalHistoryPush.call(
		history,
		addQueryArgs( window.location.href, params ),
		state
	);
}

function replace( params, state ) {
	return originalHistoryReplace.call(
		history,
		addQueryArgs( window.location.href, params ),
		state
	);
}

history.push = push;
history.replace = replace;

export default history;
