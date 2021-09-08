/**
 * Internal dependencies
 */
import * as focusable from './focusable';
import * as tabbable from './tabbable';

export const focus = { focusable, tabbable };

export * from './dom';
export { default as safeHTML } from './safe-html';
