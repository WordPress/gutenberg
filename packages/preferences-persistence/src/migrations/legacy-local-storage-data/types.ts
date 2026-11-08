import type { ScopedPreferences } from '../../types';

/**
 * Boolean 'feature' preferences, keyed by feature name.
 */
export type FeaturePreferences = Record< string, boolean | undefined >;

/**
 * Persisted state of a package's store, such as `core/edit-post`.
 */
export interface LegacyStoreState {
	preferences?: Record< string, unknown >;
	[ key: string ]: unknown;
}

/**
 * Persisted state of the `core/interface` store.
 */
export interface LegacyInterfaceStoreState {
	preferences?: {
		features?: Record< string, FeaturePreferences | undefined >;
		[ key: string ]: unknown;
	};
	enableItems?: {
		singleEnableItems?: {
			complementaryArea?: Record< string, string >;
		};
		multipleEnableItems?: {
			pinnedItems?: Record< string, Record< string, boolean > >;
		};
	};
	[ key: string ]: unknown;
}

/**
 * Persisted state of the `core/preferences` store.
 */
export interface LegacyPreferencesStoreState {
	preferences?: ScopedPreferences;
	[ key: string ]: unknown;
}

/**
 * Local storage data in the legacy `@wordpress/data` format, keyed by store name.
 */
export interface LegacyData {
	'core/interface'?: LegacyInterfaceStoreState;
	'core/preferences'?: LegacyPreferencesStoreState;
	[ storeName: string ]: LegacyStoreState | undefined;
}

/**
 * The post editor's panels state in the legacy format.
 */
export interface LegacyEditPostPanel {
	enabled?: boolean;
	opened?: boolean;
}

/**
 * The post editor's panels state in the preferences format.
 */
export interface EditPostPanels {
	inactivePanels: string[];
	openPanels: string[];
}
