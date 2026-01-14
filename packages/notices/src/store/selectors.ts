/**
 * Internal dependencies
 */
import { DEFAULT_CONTEXT } from './constants';
import type { Notice } from './types';

/**
 * The default empty set of notices to return when there are no notices
 * assigned for a given notices context. This can occur if the getNotices
 * selector is called without a notice ever having been created for the
 * context. A shared value is used to ensure referential equality between
 * sequential selector calls, since otherwise `[] !== []`.
 *
 */
const DEFAULT_NOTICES: Array< Notice > = [];

/**
 * Returns all notices as an array, optionally for a given context. Defaults to
 * the global context.
 *
 * @param state   Notices state.
 * @param context Optional grouping context.
 *
 * @example
 *
 *```js
 * import { useSelect } from '@wordpress/data';
 * import { store as noticesStore } from '@wordpress/notices';
 *
 * const ExampleComponent = () => {
 *     const notices = useSelect( ( select ) => select( noticesStore ).getNotices() );
 *     return (
 *         <ul>
 *         { notices.map( ( notice ) => (
 *             <li key={ notice.ID }>{ notice.content }</li>
 *         ) ) }
 *        </ul>
 *    )
 * };
 *```
 *
 * @return Array of notices.
 */
export function getNotices(
	state: Record< string, Array< Notice > >,
	context: string = DEFAULT_CONTEXT
) {
	return state[ context ] || DEFAULT_NOTICES;
}
