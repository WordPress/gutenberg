/**
 * External dependencies
 */
import { defer } from 'lodash';

// Remove the URL hash.
const removeURLHash = () => {
	defer( () => {
		const { pathname, search } = window.location;
		window.history.replaceState( '', document.title, pathname + search );
	} );
};

export default removeURLHash;
