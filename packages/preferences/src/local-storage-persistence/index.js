/**
 * Default plugin storage key.
 *
 * @type {string}
 */
const DEFAULT_STORAGE_KEY = 'PREFERENCES_DATA';
const EMPTY_OBJECT = {};

export default function createLocalStoragePersistenceLayer( {
	storageKey = DEFAULT_STORAGE_KEY,
} = {} ) {
	const storage = window.localStorage;

	/**
	 * Returns the persisted data as an object, defaulting to an empty object.
	 *
	 * @return {Object} Persisted data.
	 */
	async function get() {
		// If unset, getItem is expected to return null. Fall back to
		// empty object.
		const persisted = storage.getItem( storageKey );

		if ( persisted === null ) {
			return EMPTY_OBJECT;
		}

		let data;

		try {
			data = JSON.parse( persisted );
		} catch ( error ) {
			// Similarly, should any error be thrown during parse of
			// the string (malformed JSON), fall back to empty object.
			data = EMPTY_OBJECT;
		}

		return data;
	}

	/**
	 * Merges an updated reducer state into the persisted data.
	 *
	 * @param {Object} newData The data to persist.
	 */
	function set( newData ) {
		const data = { ...newData };
		storage.setItem( storageKey, JSON.stringify( data ) );
	}

	return {
		get,
		set,
	};
}
