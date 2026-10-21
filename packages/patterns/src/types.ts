import type { Block } from '@wordpress/blocks';

/**
 * A binding of a block attribute to a source.
 */
export interface Binding {
	source?: string;
	args?: Record< string, unknown >;
}

/**
 * The `metadata` attribute of a block.
 */
export interface BlockMetadata {
	id?: unknown;
	name?: string;
	bindings?: Record< string, Binding >;
	[ key: string ]: unknown;
}

/**
 * A block whose `metadata` attribute is read.
 */
export type BlockWithMetadata = Block< { metadata?: BlockMetadata } >;

/**
 * A pattern category in the merged map of core and user categories.
 */
export interface PatternCategoryEntry {
	label: string;
	name: string;
	/**
	 * The term ID, which only user categories have.
	 */
	id?: number;
}

/**
 * The core and user pattern categories, keyed by their lowercase label.
 */
export type PatternCategoryMap = Map< string, PatternCategoryEntry >;

/**
 * A REST API error.
 */
export interface RestError {
	code?: string;
	message?: string;
}

/**
 * The REST API error for a term that already exists.
 */
export interface TermExistsError {
	code: string;
	data: { term_id: number };
}
