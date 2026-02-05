/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getSyncManager } from '../sync';
import type {
	PostEditorAwarenessState as ActiveCollaborator,
	YDocDebugData,
} from '../awareness/types';
import type { SelectionCursor } from '../types';
import type { PostEditorAwareness } from '../awareness/post-editor-awareness';

interface AwarenessState {
	activeCollaborators: ActiveCollaborator[];
	getAbsolutePositionIndex: ( selection: SelectionCursor ) => number | null;
	getDebugData: () => YDocDebugData;
	isCurrentCollaboratorDisconnected: boolean;
}

const defaultState: AwarenessState = {
	activeCollaborators: [],
	getAbsolutePositionIndex: () => null,
	getDebugData: () => ( {
		doc: {},
		clients: {},
		collaboratorMap: {},
	} ),
	isCurrentCollaboratorDisconnected: false,
};

function getAwarenessState(
	awareness: PostEditorAwareness,
	newState?: ActiveCollaborator[]
): AwarenessState {
	const activeCollaborators = newState ?? awareness.getCurrentState();

	return {
		activeCollaborators,
		getAbsolutePositionIndex: ( selection: SelectionCursor ) =>
			awareness.getAbsolutePositionIndex( selection ),
		getDebugData: () => awareness.getDebugData(),
		isCurrentCollaboratorDisconnected:
			activeCollaborators.find( ( collaborator ) => collaborator.isMe )
				?.isConnected === false,
	};
}

function usePostEditorAwarenessState(
	postId: number | null,
	postType: string | null
): AwarenessState {
	const [ state, setState ] = useState< AwarenessState >( defaultState );

	useEffect( () => {
		if ( null === postId || null === postType ) {
			setState( defaultState );
			return;
		}

		const objectType = `postType/${ postType }`;
		const objectId = postId.toString();
		const awareness = getSyncManager()?.getAwareness< PostEditorAwareness >(
			objectType,
			objectId
		);

		if ( ! awareness ) {
			setState( defaultState );
			return;
		}

		awareness.setUp();

		// Initialize with current awareness state.
		setState( getAwarenessState( awareness ) );

		const unsubscribe = awareness?.onStateChange(
			( newState: ActiveCollaborator[] ) => {
				setState( getAwarenessState( awareness, newState ) );
			}
		);

		return unsubscribe;
	}, [ postId, postType ] );

	return state;
}

/**
 * Hook to get the active collaborators for a post editor.
 *
 * @param  postId   - The ID of the post.
 * @param  postType - The type of the post.
 * @return {ActiveCollaborator[]} The active collaborators.
 */
export function useActiveCollaborators(
	postId: number | null,
	postType: string | null
): ActiveCollaborator[] {
	return usePostEditorAwarenessState( postId, postType ).activeCollaborators;
}

/**
 * Hook to get the absolute position index for a post editor.
 *
 * @param  postId   - The ID of the post.
 * @param  postType - The type of the post.
 * @return {SelectionCursor} The absolute position index.
 */
export function useGetAbsolutePositionIndex(
	postId: number | null,
	postType: string | null
): ( selection: SelectionCursor ) => number | null {
	return usePostEditorAwarenessState( postId, postType )
		.getAbsolutePositionIndex;
}

/**
 * Hook to get data for debugging, using the awareness state.
 *
 * @param  postId   - The ID of the post.
 * @param  postType - The type of the post.
 * @return {YDocDebugData} The debug data.
 */
export function useGetDebugData(
	postId: number | null,
	postType: string | null
): YDocDebugData {
	return usePostEditorAwarenessState( postId, postType ).getDebugData();
}

/**
 * Hook to check if the current collaborator is disconnected.
 *
 * @param  postId   - The ID of the post.
 * @param  postType - The type of the post.
 * @return {boolean} Whether the current collaborator is disconnected.
 */
export function useIsDisconnected(
	postId: number | null,
	postType: string | null
): boolean {
	return usePostEditorAwarenessState( postId, postType )
		.isCurrentCollaboratorDisconnected;
}
