/**
 * Preferences of a single scope, such as `core/edit-post`.
 */
export type ScopePreferences = Record< string, unknown >;

/**
 * Preferences store data, keyed by scope.
 */
export type ScopedPreferences = Record< string, ScopePreferences | undefined >;

/**
 * Persisted preferences data, keyed by scope.
 */
export interface PreferencesData {
	/**
	 * When the data was last modified, as an ISO 8601 date string.
	 */
	_modified?: string;
	[ scope: string ]: unknown;
}

export interface CreateOptions {
	/**
	 * Any persisted preferences data that should be preloaded.
	 * When set, the persistence layer will avoid fetching data from the REST API.
	 */
	preloadedData?: PreferencesData | null;
	/**
	 * The key to use for restoring the localStorage backup, used when the
	 * persistence layer calls `localStorage.getItem` or `localStorage.setItem`.
	 */
	localStorageRestoreKey?: string;
	/**
	 * Debounce requests to the API so that they only occur at minimum every
	 * `requestDebounceMS` milliseconds, and don't swamp the server. Defaults to 2500ms.
	 */
	requestDebounceMS?: number;
}

export interface PersistenceLayer {
	get: () => Promise< PreferencesData >;
	set: ( newData: PreferencesData ) => void;
}
