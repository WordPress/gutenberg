/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { type EnhancedState, Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { getSyncManager } from '../sync';
import type { PostEditorState } from '../awareness/types';
import type { SelectionCursor } from '../types';
import type { PostEditorAwareness } from '../awareness/post-editor-awareness';
// import type { YDocDebugData } from '../utils/awareness-utils';

interface PostEditorAwarenessState {
	activeUsers: EnhancedState< PostEditorState >[];
	getAbsolutePositionIndex: ( selection: SelectionCursor ) => number | null;
	// getDebugData: () => YDocDebugData | null;
	isCurrentUserDisconnected: boolean;
}

const defaultState: PostEditorAwarenessState = {
	activeUsers: [],
	getAbsolutePositionIndex: () => null,
	// getDebugData: () => null,
	isCurrentUserDisconnected: false,
};

function usePostEditorAwarenessState(
	postId: number | null,
	postType: string | null
): PostEditorAwarenessState {
	const [ state, setState ] =
		useState< PostEditorAwarenessState >( defaultState );

	useEffect( () => {
		if ( null === postId || null === postType ) {
			return;
		}

		// TODO: Not the biggest fan of hardcoding the object type here like this.
		// @ts-ignore
		const awareness = getSyncManager()?.getAwareness(
			`postType/${ postType }`,
			postId.toString()
		) as PostEditorAwareness;
		const unsubscribe = awareness?.onStateChange(
			( newState: EnhancedState< PostEditorState >[] ) => {
				setState( {
					activeUsers: newState,
					getAbsolutePositionIndex: ( selection: SelectionCursor ) =>
						Y.createAbsolutePositionFromRelativePosition(
							selection.cursorPosition.relativePosition,
							awareness.doc
						)?.index ?? null,
					// getDebugData: () => getDebugData( awareness ),
					isCurrentUserDisconnected:
						newState.find( ( user ) => user.isMe )?.isConnected ===
						false,
				} );
			}
		);

		return unsubscribe;
	}, [ postId, postType ] );

	return state;
}

export function useActiveUsers(
	postId: number | null,
	postType: string | null
): EnhancedState< PostEditorState >[] {
	return usePostEditorAwarenessState( postId, postType ).activeUsers;
}

export function useGetAbsolutePositionIndex(
	postId: number | null,
	postType: string | null
): ( selection: SelectionCursor ) => number | null {
	return usePostEditorAwarenessState( postId, postType )
		.getAbsolutePositionIndex;
}

// export function useGetDebugData( postId: number | null, postType: string | null ): () => YDocDebugData | null {
// 	return usePostEditorAwarenessState( postId, postType ).getDebugData;
// }

export function useIsDisconnected(
	postId: number | null,
	postType: string | null
): boolean {
	return usePostEditorAwarenessState( postId, postType )
		.isCurrentUserDisconnected;
}
