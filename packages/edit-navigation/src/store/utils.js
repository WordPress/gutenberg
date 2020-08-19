/**
 * Internal dependencies
 */
import {
	getNavigationPostForMenu,
	getPendingActions,
	isProcessingPost,
} from './controls';

/**
 * "Kind" of the navigation post.
 *
 * @type {string}
 */
export const KIND = 'root';

/**
 * "post type" of the navigation post.
 *
 * @type {string}
 */
export const POST_TYPE = 'postType';

/**
 * Builds an ID for a new navigation post.
 *
 * @param {number} menuId Menu id.
 * @return {string} An ID.
 */
export const buildNavigationPostId = ( menuId ) =>
	`navigation-post-${ menuId }`;

/**
 * Builds a query to resolve menu items.
 *
 * @param {number} menuId Menu id.
 * @return {Object} Query.
 */
export function menuItemsQuery( menuId ) {
	return { menus: menuId, per_page: -1 };
}

/**
 * This wrapper guarantees serial execution of data processing actions.
 *
 * Examples:
 * * saveNavigationPost() needs to wait for all the missing items to be created.
 * * Concurrent createMissingMenuItems() could result in sending more requests than required.
 *
 * @param {Function} callback An action creator to wrap
 * @return {Function} Original callback wrapped in a serial execution context
 */
export function serializeProcessing( callback ) {
	return function* ( post ) {
		const postId = post.id;
		const isProcessing = yield isProcessingPost( postId );

		if ( isProcessing ) {
			yield {
				type: 'ENQUEUE_AFTER_PROCESSING',
				postId,
				action: callback,
			};
			return { status: 'pending' };
		}
		yield {
			type: 'POP_PENDING_ACTION',
			postId,
			action: callback,
		};

		yield {
			type: 'START_PROCESSING_POST',
			postId,
		};

		try {
			yield* callback(
				// re-select the post as it could be outdated by now
				yield getNavigationPostForMenu( post.meta.menuId )
			);
		} finally {
			yield {
				type: 'FINISH_PROCESSING_POST',
				postId,
				action: callback,
			};

			const pendingActions = yield getPendingActions( postId );
			if ( pendingActions.length ) {
				const serializedCallback = serializeProcessing(
					pendingActions[ 0 ]
				);

				yield* serializedCallback( post );
			}
		}
	};
}
