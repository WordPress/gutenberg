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
	const [ postHistory, dispatch ] = useReducer(
		(
			historyState,
			{ type, post, previousRenderingMode, selectedBlockClientId }
		) => {
			if ( type === 'push' ) {
				return [
					...historyState,
					{ post, previousRenderingMode, selectedBlockClientId },
				];
			}
			if ( type === 'pop' ) {
				// Try to leave one item in the history.
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
	const { getSelectedBlockClientId } = useSelect( blockEditorStore );
	const { selectBlock } = useDispatch( blockEditorStore );

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Capture currently selected block before navigating
			const currentSelectedBlockClientId = getSelectedBlockClientId();

			dispatch( {
				type: 'push',
				post: { postId: params.postId, postType: params.postType },
				// Save the current rendering mode so we can restore it when navigating back.
				previousRenderingMode: getRenderingMode(),
				selectedBlockClientId: currentSelectedBlockClientId,
			} );
			setRenderingMode( defaultRenderingMode );
		},
		[
			getRenderingMode,
			setRenderingMode,
			defaultRenderingMode,
			getSelectedBlockClientId,
		]
	);

	const onNavigateToPreviousEntityRecord = useCallback( () => {
		dispatch( { type: 'pop' } );
		if ( previousRenderingMode ) {
			setRenderingMode( previousRenderingMode );
		}
		// Restore block selection and focus after a short delay to allow rendering to complete
		if ( selectedBlockClientId && typeof window !== 'undefined' ) {
			const restoreSelection = () => {
				// Use a small delay to ensure content is rendered
				setTimeout( () => {
					selectBlock( selectedBlockClientId );
				}, 100 );
			};

			if ( typeof window.requestAnimationFrame !== 'undefined' ) {
				window.requestAnimationFrame( restoreSelection );
			} else {
				restoreSelection();
			}
		}
	}, [
		setRenderingMode,
		previousRenderingMode,
		selectedBlockClientId,
		selectBlock,
	] );

	return {
		currentPost: post,
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord:
			postHistory.length > 1
				? onNavigateToPreviousEntityRecord
				: undefined,
	};
}
