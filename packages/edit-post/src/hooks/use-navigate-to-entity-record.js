/**
 * WordPress dependencies
 */
import { useCallback, useReducer } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore, privateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { useGenerateBlockPath } = unlock( privateApis );

/**
 * A hook that records the 'entity' history in the post editor as a user
 * navigates between editing a post and editing the post template or patterns.
 *
 * Implemented as a stack, so a little similar to the browser history API.
 *
 * Used to control displaying UI elements like the back button.
 *
 * @param {number} initialPostId        The post id of the post when the editor loaded.
 * @param {string} initialPostType      The post type of the post when the editor loaded.
 * @param {string} defaultRenderingMode The rendering mode to switch to when navigating.
 *
 * @return {Object} An object containing the `currentPost` variable and
 *                 `onNavigateToEntityRecord` and `onNavigateToPreviousEntityRecord` functions.
 */
export default function useNavigateToEntityRecord(
	initialPostId,
	initialPostType,
	defaultRenderingMode
) {
	const generateBlockPath = useGenerateBlockPath();
	const [ postHistory, dispatch ] = useReducer(
		(
			historyState,
			{ type, post, previousRenderingMode, selectedBlockPath }
		) => {
			if ( type === 'push' ) {
				// Update the current item with the selected block path before pushing new item
				const updatedHistory = [ ...historyState ];
				const currentIndex = updatedHistory.length - 1;
				updatedHistory[ currentIndex ] = {
					...updatedHistory[ currentIndex ],
					selectedBlockPath,
				};
				return [ ...updatedHistory, { post, previousRenderingMode } ];
			}
			if ( type === 'pop' ) {
				// Remove the current item from history
				if ( historyState.length > 1 ) {
					return historyState.slice( 0, -1 );
				}
			}
			return historyState;
		},
		[
			{
				post: { postId: initialPostId, postType: initialPostType },
			},
		]
	);
	const { post, previousRenderingMode, selectedBlockPath } =
		postHistory[ postHistory.length - 1 ];

	const { getRenderingMode } = useSelect( editorStore );
	const { setRenderingMode } = useDispatch( editorStore );

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Generate block path from clientId if provided
			const blockPath = params.selectedBlockClientId
				? generateBlockPath( params.selectedBlockClientId )
				: null;

			dispatch( {
				type: 'push',
				post: { postId: params.postId, postType: params.postType },
				// Save the current rendering mode so we can restore it when navigating back.
				previousRenderingMode: getRenderingMode(),
				selectedBlockPath: blockPath,
			} );
			setRenderingMode( defaultRenderingMode );
		},
		[
			getRenderingMode,
			setRenderingMode,
			defaultRenderingMode,
			generateBlockPath,
		]
	);

	const onNavigateToPreviousEntityRecord = useCallback( () => {
		dispatch( {
			type: 'pop',
		} );
		if ( previousRenderingMode ) {
			setRenderingMode( previousRenderingMode );
		}
	}, [ setRenderingMode, previousRenderingMode ] );

	return {
		currentPost: post,
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord:
			postHistory.length > 1
				? onNavigateToPreviousEntityRecord
				: undefined,
		// Return the selected block path from the current history item
		previousSelectedBlockPath: selectedBlockPath,
	};
}
