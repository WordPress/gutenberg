/**
 * Internal dependencies
 */
import type { StorageInterface } from '../../../types';
import objectStorage from './object';

let storage: StorageInterface & { removeItem?: ( key: string ) => void };

try {
	// Private Browsing in Safari 10 and earlier will throw an error when
	// attempting to set into localStorage. The test here is intentional in
	// causing a thrown error as condition for using fallback object storage.
	storage = window.localStorage;
	storage.setItem( '__wpDataTestLocalStorage', '' );
	storage.removeItem!( '__wpDataTestLocalStorage' );
} catch ( error ) {
	storage = objectStorage;
}

export default storage;
