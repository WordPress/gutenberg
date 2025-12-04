/**
 * WordPress dependencies
 */
import { useCallback, useReducer } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

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
			{ type, post, previousRenderingMode, scrollPosition }
		) => {
			if ( type === 'push' ) {
				return [
					...historyState,
					{ post, previousRenderingMode, scrollPosition },
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

	const { post, previousRenderingMode, scrollPosition } =
		postHistory[ postHistory.length - 1 ];

	const { getRenderingMode } = useSelect( editorStore );
	const { setRenderingMode } = useDispatch( editorStore );

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Capture current scroll position from the editor canvas iframe
			const iframe = document.querySelector(
				'iframe[name="editor-canvas"]'
			);
			const iframeDocument =
				iframe?.contentDocument || iframe?.contentWindow?.document;
			const scrollElement = iframeDocument?.documentElement;

			const currentScrollPosition = scrollElement
				? { x: scrollElement.scrollLeft, y: scrollElement.scrollTop }
				: { x: window.scrollX, y: window.scrollY };

			dispatch( {
				type: 'push',
				post: { postId: params.postId, postType: params.postType },
				// Save the current rendering mode so we can restore it when navigating back.
				previousRenderingMode: getRenderingMode(),
				scrollPosition: currentScrollPosition,
			} );
			setRenderingMode( defaultRenderingMode );
		},
		[ getRenderingMode, setRenderingMode, defaultRenderingMode ]
	);

	const onNavigateToPreviousEntityRecord = useCallback( () => {
		dispatch( { type: 'pop' } );
		if ( previousRenderingMode ) {
			setRenderingMode( previousRenderingMode );
		}
		// Restore scroll position after a short delay to allow rendering to complete
		if ( scrollPosition && typeof window !== 'undefined' ) {
			const restoreScroll = () => {
				// The editor canvas is inside an iframe
				const iframe = document.querySelector(
					'iframe[name="editor-canvas"]'
				);
				const iframeWindow = iframe?.contentWindow;

				if ( iframeWindow ) {
					// Use a small delay to ensure content is rendered
					setTimeout( () => {
						iframeWindow.scrollTo(
							scrollPosition.x,
							scrollPosition.y
						);
					}, 100 );
				} else {
					window.scrollTo( scrollPosition.x, scrollPosition.y );
				}
			};

			if ( typeof window.requestAnimationFrame !== 'undefined' ) {
				window.requestAnimationFrame( restoreScroll );
			} else {
				restoreScroll();
			}
		}
	}, [ setRenderingMode, previousRenderingMode, scrollPosition ] );

	return {
		currentPost: post,
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord:
			postHistory.length > 1
				? onNavigateToPreviousEntityRecord
				: undefined,
	};
}
