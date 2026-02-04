/**
 * WordPress dependencies
 */
import { useCallback, useReducer } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as blockEditorStore } from '@wordpress/block-editor';

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
	const getExternalClientId = useSelect(
		( select ) => select( blockEditorStore ).getExternalClientId,
		[]
	);
	const [ postHistory, dispatch ] = useReducer(
		(
			historyState,
			{ type, post, previousRenderingMode, selectedBlockClientId }
		) => {
			if ( type === 'push' ) {
				// Update the current item with the selected block clientId before pushing new item
				const updatedHistory = [ ...historyState ];
				const currentIndex = updatedHistory.length - 1;
				updatedHistory[ currentIndex ] = {
					...updatedHistory[ currentIndex ],
					selectedBlockClientId,
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
	const { post, previousRenderingMode, selectedBlockClientId } =
		postHistory[ postHistory.length - 1 ];

	const { getRenderingMode } = useSelect( editorStore );
	const { setRenderingMode } = useDispatch( editorStore );

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Convert internal clientId to external for storage
			const externalClientId = params.selection?.clientId
				? getExternalClientId( params.selection.clientId )
				: null;

			dispatch( {
				type: 'push',
				post: { postId: params.postId, postType: params.postType },
				// Save the current rendering mode so we can restore it when navigating back.
				previousRenderingMode: getRenderingMode(),
				selectedBlockClientId: externalClientId,
			} );
			setRenderingMode( defaultRenderingMode );
		},
		[
			getRenderingMode,
			setRenderingMode,
			defaultRenderingMode,
			getExternalClientId,
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
		// Return the initial selection object from the current history item
		initialSelection: selectedBlockClientId
			? { clientId: selectedBlockClientId }
			: null,
	};
}
