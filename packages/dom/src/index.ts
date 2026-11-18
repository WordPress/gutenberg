import * as focusable from './focusable';
import * as tabbable from './tabbable';

/**
 * Object grouping `focusable` and `tabbable` utils
 * under the keys with the same name.
 *
 * Use `focus.focusable.isFocusable( element )` to check an individual element,
 * or `focus.focusable.find( container )` to find focusable descendants.
 */
export const focus = { focusable, tabbable };

export * from './dom';
export * from './phrasing-content';
export * from './data-transfer';

/**
 * Schema of the content allowed inside an element, keyed by tag name.
 */
export type { ContentSchema } from './types';

/**
 * The attributes and children allowed for an element in a `ContentSchema`.
 */
export type { SemanticElementDefinition } from './types';

/**
 * Schema that `cleanNodeList` and `removeInvalidHTML` clean HTML against,
 * keyed by tag name.
 */
export type { Schema } from './dom/types';

/**
 * The rules for a single tag in a `Schema`.
 */
export type { SchemaItem } from './dom/types';
