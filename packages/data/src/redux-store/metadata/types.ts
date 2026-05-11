/**
 * Internal dependencies
 */
import type { StoreDescriptor, ReduxStoreConfig } from '../../types';
import type { StateValue as MetadataStateValue } from './reducer';

/**
 * Extracts selector key names from a store descriptor.
 * Falls back to `string` when the store type is unknown.
 */
export type SelectorKeysOf< S > = S extends StoreDescriptor<
	ReduxStoreConfig< any, any, infer Selectors >
>
	? string & keyof Selectors
	: string;

/**
 * Metadata selectors injected into every Redux store.
 *
 * These are resolution-tracking selectors that the data module
 * automatically adds to every registered store. The `S` parameter
 * provides type-safe selector names via `SelectorKeysOf`.
 */
export type MetadataSelectors< S = unknown > = {
	getResolutionState: (
		selectorName: SelectorKeysOf< S >,
		args?: unknown[] | null
	) => MetadataStateValue | undefined;
	getIsResolving: (
		selectorName: SelectorKeysOf< S >,
		args?: unknown[] | null
	) => boolean | undefined;
	hasStartedResolution: (
		selectorName: SelectorKeysOf< S >,
		args?: unknown[] | null
	) => boolean;
	hasFinishedResolution: (
		selectorName: SelectorKeysOf< S >,
		args?: unknown[] | null
	) => boolean;
	hasResolutionFailed: (
		selectorName: SelectorKeysOf< S >,
		args?: unknown[] | null
	) => boolean;
	getResolutionError: (
		selectorName: SelectorKeysOf< S >,
		args?: unknown[] | null
	) => Error | unknown;
	isResolving: (
		selectorName: SelectorKeysOf< S >,
		args?: unknown[] | null
	) => boolean;
	getCachedResolvers: () => Record< string, unknown >;
	hasResolvingSelectors: () => boolean;
	countSelectorsByStatus: () => Record< string, number >;
};

/**
 * Metadata actions injected into every Redux store.
 *
 * These are resolution-tracking actions that the data module
 * automatically adds to every registered store. The `S` parameter
 * provides type-safe selector names via `SelectorKeysOf`.
 */
export type MetadataActions< S = unknown > = {
	startResolution: (
		selectorName: SelectorKeysOf< S >,
		args: unknown[]
	) => Promise< void >;
	finishResolution: (
		selectorName: SelectorKeysOf< S >,
		args: unknown[]
	) => Promise< void >;
	failResolution: (
		selectorName: SelectorKeysOf< S >,
		args: unknown[],
		error: Error | unknown
	) => Promise< void >;
	startResolutions: (
		selectorName: SelectorKeysOf< S >,
		args: unknown[][]
	) => Promise< void >;
	finishResolutions: (
		selectorName: SelectorKeysOf< S >,
		args: unknown[][]
	) => Promise< void >;
	failResolutions: (
		selectorName: SelectorKeysOf< S >,
		args: unknown[],
		errors: ( Error | unknown )[]
	) => Promise< void >;
	invalidateResolution: (
		selectorName: SelectorKeysOf< S >,
		args: unknown[]
	) => Promise< void >;
	invalidateResolutionForStore: () => Promise< void >;
	invalidateResolutionForStoreSelector: (
		selectorName: SelectorKeysOf< S >
	) => Promise< void >;
};
