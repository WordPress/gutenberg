/**
 * External dependencies
 */
import { defer } from 'lodash';

/**
 * Remove the hash from the browser URL.
 */
const removeURLHash = () => {
	defer( () => {
		const { pathname, search } = window.location;
		window.history.replaceState( '', document.title, pathname + search );
	} );
};

export default removeURLHash;
