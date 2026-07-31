/**
 * Internal dependencies
 */
import type { AnyMessage } from './types';

/**
 * The message catalog for `@wordpress/ui`.
 *
 * Every entry is a function so that its gettext call runs only when that
 * message is needed, rather than resolving the whole catalog when the module
 * loads. Going through a function also leaves room to resolve messages through
 * something other than the global `__` later.
 */
const messages = {} satisfies Record< string, AnyMessage >;

export type { AnyMessage, Message } from './types';
export type UIMessages = typeof messages;

export default messages;
