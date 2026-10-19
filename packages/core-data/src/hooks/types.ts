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

/**
 * Options of `useEntityBlockEditor`.
 */
export interface EntityBlockEditorOptions {
	/**
	 * An entity ID to use instead of the context-provided one.
	 */
	id?: string | number;
}

/**
 * The blocks of `useEntityBlockEditor`, and its input and change handlers.
 */
export type EntityBlockEditorResult = [
	Array< Block > | undefined,
	EntityBlockEditorHandler,
	EntityBlockEditorHandler,
];

/**
 * The value of `useEntityProp`, its setter and the full value from the REST
 * API.
 */
export type EntityPropResult< Value > = [
	Value | undefined,
	( newValue: Value ) => void,
	unknown,
];
