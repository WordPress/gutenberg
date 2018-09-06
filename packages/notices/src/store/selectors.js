/**
 * Internal dependencies
 */
import { DEFAULT_CONTEXT } from './constants';

/**
 * The default empty set of notices to return when there are no notices
 * assigned for a given notices context. This can occur if the getNotices
 * selector is called without a notice ever having been created for the
 * context. A shared value is used to ensure referential equality between
 * sequential selector calls, since otherwise `[] !== []`.
 *
 * @type {Array}
 */
const DEFAULT_NOTICES = [];

/**
 * Notice object.
 *
 * @property {string}  id            Unique identifier of notice.
 * @property {string}  status        Status sort of notice, one of `success`,
 *                                   `info`, `error`, or `warning`. Defaults to
 *                                   `info`.
 * @property {string}  content       Notice message.
 * @property {boolean} isDismissible Whether the notice can be dismissed by the
 *                                   user. Defaults to `true`.
 *
 * @typedef {Notice}
 */

/**
 * Returns all notices as an array, optionally for a given context. Defaults to
 * the global context.
 *
 * @param {Object}  state   Notices state.
 * @param {?string} context Optional grouping context.
 *
 * @return {Notice[]} Array of notices.
 */
export function getNotices( state, context = DEFAULT_CONTEXT ) {
	return state[ context ] || DEFAULT_NOTICES;
}
