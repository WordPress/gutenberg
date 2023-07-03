/**
 * Internal dependencies
 */
import * as focusable from './focusable';
import * as tabbable from './tabbable';

/**
 * Object grouping `focusable` and `tabbable` utils
 * under the keys with the same name.
 */
export const focus = { focusable, tabbable };

export * from './dom';
export * from './phrasing-content';
export * from './data-transfer';
