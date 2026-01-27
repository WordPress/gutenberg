/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getSyncManager } from '../sync';
import type { PostEditorAwarenessState as ActiveUser } from '../awareness/types';
import type { SelectionCursor } from '../types';
import type { PostEditorAwareness } from '../awareness/post-editor-awareness';

interface AwarenessState {
	activeUsers: ActiveUser[];
	getAbsolutePositionIndex: ( selection: SelectionCursor ) => number | null;
	isCurrentUserDisconnected: boolean;
}

const defaultState: AwarenessState = {
	activeUsers: [],
	getAbsolutePositionIndex: () => null,
	isCurrentUserDisconnected: false,
};

function getAwarenessState(
	awareness: PostEditorAwareness,
	newState?: ActiveUser[]
): AwarenessState {
	const activeUsers = newState ?? awareness.getCurrentState();

	return {
		activeUsers,
		getAbsolutePositionIndex: ( selection: SelectionCursor ) =>
			awareness.getAbsolutePositionIndex( selection ),
		isCurrentUserDisconnected:
			activeUsers.find( ( user ) => user.isMe )?.isConnected === false,
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

		// Initialize with current awareness state.
		setState( getAwarenessState( awareness ) );

		const unsubscribe = awareness?.onStateChange(
			( newState: ActiveUser[] ) => {
				setState( getAwarenessState( awareness, newState ) );
			}
		);

		return unsubscribe;
	}, [ postId, postType ] );

	return state;
}

export function useActiveUsers(
	postId: number | null,
	postType: string | null
): ActiveUser[] {
	return usePostEditorAwarenessState( postId, postType ).activeUsers;
}

export function useGetAbsolutePositionIndex(
	postId: number | null,
	postType: string | null
): ( selection: SelectionCursor ) => number | null {
	return usePostEditorAwarenessState( postId, postType )
		.getAbsolutePositionIndex;
}

export function useIsDisconnected(
	postId: number | null,
	postType: string | null
): boolean {
	return usePostEditorAwarenessState( postId, postType )
		.isCurrentUserDisconnected;
}
