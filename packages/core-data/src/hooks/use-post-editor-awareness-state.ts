/**
 * External dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	PostEditorAwarenessState as ActiveCollaborator,
	PostSaveEvent,
	YDocDebugData,
} from '../awareness/types';
import type { SelectionState, ResolvedSelection } from '../types';

interface AwarenessState {
	activeCollaborators: ActiveCollaborator[];
	resolveSelection: ( selection: SelectionState ) => ResolvedSelection;
	getDebugData: () => YDocDebugData;
	isCurrentCollaboratorDisconnected: boolean;
}

const defaultResolvedSelection: ResolvedSelection = {
	richTextOffset: null,
	localClientId: null,
};

const defaultState: AwarenessState = {
	activeCollaborators: [],
	resolveSelection: () => defaultResolvedSelection,
	getDebugData: () => ( {
		doc: {},
		clients: {},
		collaboratorMap: {},
	} ),
	isCurrentCollaboratorDisconnected: false,
};

function usePostEditorAwarenessState(
	postId: number | null,
	postType: string | null
): AwarenessState {
	void postId;
	void postType;
	return defaultState;
}

/**
 * Hook to get the active collaborators for a post editor.
 *
 * @param postId   The ID of the post.
 * @param postType The type of the post.
 * @return The active collaborators (empty without collaborative sync).
 */
export function useActiveCollaborators(
	postId: number | null,
	postType: string | null
): ActiveCollaborator[] {
	return usePostEditorAwarenessState( postId, postType ).activeCollaborators;
}

/**
 * Hook to resolve a selection state to a text index and block client ID.
 *
 * @param postId   The ID of the post.
 * @param postType The type of the post.
 * @return A function that resolves a selection to its text index and block client ID.
 */
export function useResolvedSelection(
	postId: number | null,
	postType: string | null
): ( selection: SelectionState ) => ResolvedSelection {
	return usePostEditorAwarenessState( postId, postType ).resolveSelection;
}

/**
 * Hook to get data for debugging, using the awareness state.
 *
 * @param postId   The ID of the post.
 * @param postType The type of the post.
 * @return The debug data.
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
 * @param postId   The ID of the post.
 * @param postType The type of the post.
 * @return Whether the current collaborator is disconnected.
 */
export function useIsDisconnected(
	postId: number | null,
	postType: string | null
): boolean {
	return usePostEditorAwarenessState( postId, postType )
		.isCurrentCollaboratorDisconnected;
}

function useLastPostSave(
	postId: number | null,
	postType: string | null
): PostSaveEvent | null {
	void postId;
	void postType;
	return null;
}

/**
 * Hook that fires a callback when a new collaborator joins the post.
 *
 * @param postId   The ID of the post.
 * @param postType The type of the post.
 * @param callback Invoked for each collaborator that joins.
 */
export function useOnCollaboratorJoin(
	postId: number | null,
	postType: string | null,
	callback: (
		collaborator: ActiveCollaborator,
		me?: ActiveCollaborator
	) => void
): void {
	const { activeCollaborators } = usePostEditorAwarenessState(
		postId,
		postType
	);
	const prevCollaborators = usePrevious( activeCollaborators );

	useEffect( () => {
		if ( ! prevCollaborators || prevCollaborators.length === 0 ) {
			return;
		}

		const prevMap = new Map< number, ActiveCollaborator >(
			prevCollaborators.map( ( collaborator ) => [
				collaborator.clientId,
				collaborator,
			] )
		);
		const me = activeCollaborators.find(
			( collaborator ) => collaborator.isMe
		);

		for ( const collaborator of activeCollaborators ) {
			if (
				! prevMap.has( collaborator.clientId ) &&
				! collaborator.isMe
			) {
				callback( collaborator, me );
			}
		}
	}, [ activeCollaborators, prevCollaborators, callback ] );
}

/**
 * Hook that fires a callback when a collaborator leaves the post.
 *
 * @param postId   The ID of the post.
 * @param postType The type of the post.
 * @param callback Invoked for each collaborator that leaves.
 */
export function useOnCollaboratorLeave(
	postId: number | null,
	postType: string | null,
	callback: ( collaborator: ActiveCollaborator ) => void
): void {
	const { activeCollaborators } = usePostEditorAwarenessState(
		postId,
		postType
	);
	const prevCollaborators = usePrevious( activeCollaborators );

	useEffect( () => {
		if ( ! prevCollaborators || prevCollaborators.length === 0 ) {
			return;
		}

		const newMap = new Map< number, ActiveCollaborator >(
			activeCollaborators.map( ( collaborator ) => [
				collaborator.clientId,
				collaborator,
			] )
		);

		for ( const prevCollab of prevCollaborators ) {
			if ( prevCollab.isMe || ! prevCollab.isConnected ) {
				continue;
			}

			const newCollab = newMap.get( prevCollab.clientId );
			if ( ! newCollab?.isConnected ) {
				callback( prevCollab );
			}
		}
	}, [ activeCollaborators, prevCollaborators, callback ] );
}

/**
 * Hook that fires a callback when a remote collaborator saves the post.
 *
 * @param postId   The ID of the post.
 * @param postType The type of the post.
 * @param callback Invoked with the save event, the collaborator who saved,
 *                 and the previous save event (if any) for transition detection.
 */
export function useOnPostSave(
	postId: number | null,
	postType: string | null,
	callback: (
		event: PostSaveEvent,
		saver: ActiveCollaborator,
		prevEvent: PostSaveEvent | null
	) => void
): void {
	const { activeCollaborators } = usePostEditorAwarenessState(
		postId,
		postType
	);
	const lastPostSave = useLastPostSave( postId, postType );
	const prevPostSave = usePrevious( lastPostSave );

	useEffect( () => {
		if ( ! lastPostSave ) {
			return;
		}

		if ( prevPostSave && lastPostSave.savedAt === prevPostSave.savedAt ) {
			return;
		}

		const saver = activeCollaborators.find(
			( collaborator ) =>
				collaborator.clientId === lastPostSave.savedByClientId &&
				! collaborator.isMe
		);

		if ( ! saver ) {
			return;
		}

		callback( lastPostSave, saver, prevPostSave ?? null );
	}, [ lastPostSave, prevPostSave, activeCollaborators, callback ] );
}
