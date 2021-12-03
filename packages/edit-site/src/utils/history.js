/**
 * External dependencies
 */
import { createBrowserHistory } from 'history';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

const history = createBrowserHistory();

function push( params, state ) {
	history.push( addQueryArgs( window.location.href, params ), state );
}

function replace( params, state ) {
	history.replace( addQueryArgs( window.location.href, params ), state );
}

export default {
	...history,
	push,
	replace,
};
