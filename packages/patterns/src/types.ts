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
