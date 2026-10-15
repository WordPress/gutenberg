import type { Action } from '@wordpress/dataviews';

/**
 * The JavaScript parts of an action: what PHP cannot serialize, such as
 * `callback`, `RenderModal`, `isEligible`, `icon`, or a `label` that depends
 * on the items. Its data is declared on the server, see `src/index.php`.
 *
 * Distributes over the kinds of actions, so a modal action keeps its
 * `RenderModal` and a button action its `callback`.
 */
export type ActionScriptParts< Item = any > =
	Action< Item > extends infer Kind
		? Kind extends Action< Item >
			? Partial< Omit< Kind, 'id' > >
			: never
		: never;

/**
 * The JavaScript parts of the actions a script module provides, keyed by
 * action id.
 *
 * It is the shape of the default export of a script module registered along
 * with actions on the server. The script modules of this package are the
 * reference implementation of such modules; a plugin's own action module
 * follows the same shape.
 */
export interface ActionsScriptParts< Item = any > {
	[ actionId: string ]: ActionScriptParts< Item >;
}
