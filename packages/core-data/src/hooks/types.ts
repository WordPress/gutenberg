import type { Block } from '@wordpress/blocks';

/**
 * Options of the `useEntityBlockEditor` change and input handlers, as a
 * `BlockEditorProvider` passes them, forwarded to `editEntityRecord`.
 */
export interface EntityBlockEditorChangeOptions {
	selection?: unknown;
	[ key: string ]: unknown;
}

/**
 * The fields of an edited record that `useEntityBlockEditor` reads.
 */
export interface EntityBlockEditorRecord {
	blocks?: Array< Block >;
	content?: unknown;
	meta?: Record< string, unknown >;
}

/**
 * A `useEntityBlockEditor` handler for block changes.
 */
export type EntityBlockEditorHandler = (
	newBlocks: Array< Block >,
	options: EntityBlockEditorChangeOptions
) => void;
