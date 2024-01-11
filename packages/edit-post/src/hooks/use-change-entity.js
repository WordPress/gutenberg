/**
 * WordPress dependencies
 */
import { useCallback, useReducer } from '@wordpress/element';
import { addQueryArgs, getQueryArgs, removeQueryArgs } from '@wordpress/url';

/**
 * A hook that records the 'entity' history in the post editor as a user
 * navigates between editing a post and editing the post template or patterns.
 *
 * Implemented as a stack, so a little similar to the browser history API.
 *
 * Used to control displaying UI elements like the back button.
 *
 * @param {number} initialPostId   The post id of the post when the editor loaded.
 * @param {string} initialPostType The post type of the post when the editor loaded.
 *
 * @return {Object} An object containing the `currentPost`, `hasHistory` and `href` variable and
 *                 `loadEntity` and `goBack` functions.
 */
export default function useChangeEntity( initialPostId, initialPostType ) {
	const [ postHistory, dispatch ] = useReducer(
		( historyState, { type, post } ) => {
			if ( type === 'push' ) {
				return [ ...historyState, post ];
			}
			if ( type === 'pop' ) {
				// Try to leave one item in the history.
				if ( historyState.length > 1 ) {
					return historyState.slice( 0, -1 );
				}
			}
			return historyState;
		},
		[ { postId: initialPostId, postType: initialPostType } ]
	);

	const getEntityLoader = useCallback( ( params ) => {
		const currentArgs = getQueryArgs( window.location.href );
		const currentUrlWithoutArgs = removeQueryArgs(
			window.location.href,
			...Object.keys( currentArgs )
		);

		const newUrl = addQueryArgs( currentUrlWithoutArgs, {
			post: params.postId,
			action: 'edit',
		} );

		return {
			href: newUrl,
			loadEntity: ( event ) => {
				event?.preventDefault();
				dispatch( {
					type: 'push',
					post: { postId: params.postId, postType: params.postType },
				} );
			},
		};
	}, [] );

	const goBack = useCallback( () => {
		dispatch( { type: 'pop' } );
	}, [] );

	const currentPost = postHistory[ postHistory.length - 1 ];

	return {
		currentPost,
		changeEntity: {
			getEntityLoader,
			hasHistory: postHistory.length > 1,
			goBack,
		},
	};
}
