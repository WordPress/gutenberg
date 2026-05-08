/**
 * Internal dependencies
 */
import type {
	PostEditorAwarenessState as ActiveCollaborator,
	PostSaveEvent,
	YDocDebugData,
} from '../awareness/types';
import type { SelectionState, ResolvedSelection } from '../types';

const defaultResolvedSelection: ResolvedSelection = {
	richTextOffset: null,
	localClientId: null,
};

const emptyCollaborators: ActiveCollaborator[] = [];

const resolveDefaultSelection = (
	selection: SelectionState
): ResolvedSelection => {
	void selection;
	return defaultResolvedSelection;
};

const defaultDebugData: YDocDebugData = {
	doc: {},
	clients: {},
	collaboratorMap: {},
};

/**
 * Hook to get the active collaborators for a post editor.
 *
 * @param postId   - The ID of the post.
 * @param postType - The type of the post.
 * @return The active collaborators.
 */
export function useActiveCollaborators(
	postId: number | null,
	postType: string | null
): ActiveCollaborator[] {
	void postId;
	void postType;
	return emptyCollaborators;
}

/**
 * Hook to resolve a selection state to a text index and block client ID.
 *
 * @param postId   - The ID of the post.
 * @param postType - The type of the post.
 * @return A function that resolves a selection to its text index and block client ID.
 */
export function useResolvedSelection(
	postId: number | null,
	postType: string | null
): ( selection: SelectionState ) => ResolvedSelection {
	void postId;
	void postType;
	return resolveDefaultSelection;
}

/**
 * Hook to get data for debugging, using the awareness state.
 *
 * @param postId   - The ID of the post.
 * @param postType - The type of the post.
 * @return The debug data.
 */
export function useGetDebugData(
	postId: number | null,
	postType: string | null
): YDocDebugData {
	void postId;
	void postType;
	return defaultDebugData;
}

/**
 * Hook to check if the current collaborator is disconnected.
 *
 * @param postId   - The ID of the post.
 * @param postType - The type of the post.
 * @return Whether the current collaborator is disconnected.
 */
export function useIsDisconnected(
	postId: number | null,
	postType: string | null
): boolean {
	void postId;
	void postType;
	return false;
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
	void postId;
	void postType;
	void callback;
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
	void postId;
	void postType;
	void callback;
}

/**
 * Hook that fires a callback when a remote collaborator saves the post.
 *
 * @param postId   The ID of the post.
 * @param postType The type of the post.
 * @param callback Invoked with the save event, the collaborator who saved,
 *                 and the previous save event, if any.
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
	void postId;
	void postType;
	void callback;
}
