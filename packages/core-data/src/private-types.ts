/**
 * Types internal to the package, which the package root does not re-export.
 */
import type { Block } from '@wordpress/blocks';
import type { EntityProviderProps } from './types';

/**
 * The IDs of the provided entities, by kind and name, and their revisions
 * under `revision`: a revision ID, or a record to read from.
 */
export type EntityContextValue = Record<
	string,
	Record< string, unknown > | undefined
> & {
	revision?: Record<
		string,
		| Record< string, number | string | Record< string, unknown > >
		| undefined
	>;
};

/**
 * The props of `PrivateEntityProvider`.
 */
export interface PrivateEntityProviderProps extends EntityProviderProps {
	/**
	 * Optional record to read from.
	 */
	revision?: Record< string, unknown >;
}

/**
 * Blocks cached for an entity, with the `content` string they were parsed from.
 */
export interface ParsedBlocksCacheEntry {
	content: string;
	blocks: Array< Block >;
}
