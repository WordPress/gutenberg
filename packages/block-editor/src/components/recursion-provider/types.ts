import type { ReactNode } from 'react';

/**
 * Unique identifiers of the rendered block instances, grouped by block name.
 */
export type RenderedBlocks = Record< string, Set< unknown > >;

export interface RecursionProviderProps {
	/** Any value that acts as a unique identifier for a block instance. */
	uniqueId: unknown;
	/** Optional block name. */
	blockName?: string;
	/** React children. */
	children?: ReactNode;
}
