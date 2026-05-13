/**
 * External dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import type { Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { getSyncManager } from '../sync';
import type {
	PostEditorAwarenessState as ActiveCollaborator,
	PostSaveEvent,
	YDocDebugData,
} from '../awareness/types';
import type { SelectionState, ResolvedSelection } from '../types';
import type { PostEditorAwareness } from '../awareness/post-editor-awareness';

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

function getAwarenessState(
	awareness: PostEditorAwareness,
	newState?: ActiveCollaborator[]
): AwarenessState {
	const activeCollaborators = newState ?? awareness.getCurrentState();

	return {
		activeCollaborators,
		resolveSelection: ( selection: SelectionState ) =>
			awareness.convertSelectionStateToAbsolute( selection ),
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
	return usePostEditorAwarenessState( postId, postType ).resolveSelection;
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

/**
 * Hook that subscribes to the CRDT state map and returns the most recent
 * save event (timestamp + client ID). The state map is updated by
 * `markEntityAsSaved` in `@wordpress/sync`
 *
 * @param postId   The ID of the post.
 * @param postType The type of the post.
 */
function useLastPostSave(
	postId: number | null,
	postType: string | null
): PostSaveEvent | null {
	const [ lastSave, setLastSave ] = useState< PostSaveEvent | null >( null );

	useEffect( () => {
		if ( null === postId || null === postType ) {
			setLastSave( null );
			return;
		}

		const awareness = getSyncManager()?.getAwareness< PostEditorAwareness >(
			`postType/${ postType }`,
			postId.toString()
		);

		if ( ! awareness ) {
			setLastSave( null );
			return;
		}

		awareness.setUp();

		const stateMap = awareness.doc.getMap( 'state' );
		const recordMap = awareness.doc.getMap( 'document' );

		// Only notify for saves that occur after the observer is
		// set up. This prevents false notifications when the Y.Doc
		// syncs historical state on page load or peer reconnect.
		const setupTime = Date.now();

		const observer = ( event: Y.YMapEvent< unknown > ) => {
			if ( event.keysChanged.has( 'savedAt' ) ) {
				const savedAt = stateMap.get( 'savedAt' ) as number;
				const savedByClientId = stateMap.get( 'savedBy' ) as number;

				if (
					typeof savedAt === 'number' &&
					typeof savedByClientId === 'number' &&
					savedAt > setupTime
				) {
					const postStatus = recordMap.get( 'status' ) as
						| string
						| undefined;
					setLastSave( { savedAt, savedByClientId, postStatus } );
				}
			}
		};

		stateMap.observe( observer );

		return () => {
			stateMap.unobserve( observer );
		};
	}, [ postId, postType ] );

	return lastSave;
}

/**
 * Hook that fires a callback when a new collaborator joins the post.
 * Handles initial hydration and state diffing internally—consumers
 * only receive "join" events for collaborators that appear after the
 * initial state has loaded.
 *
 * The callback receives the joining collaborator and, when available,
 * the current user's state (useful for comparing `enteredAt` timestamps).
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
		/*
		 * On first render usePrevious returns undefined. On subsequent
		 * renders the list may still be empty while the store hydrates.
		 * In both cases, skip to avoid spurious "joined" callbacks for
		 * users already present.
		 */
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
 * A "leave" is detected when a previously-connected collaborator either
 * transitions to `isConnected = false` or disappears from the list
 * entirely while still connected. Already-disconnected collaborators
 * that are later removed from the list are silently ignored.
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
 * Only fires for saves by other collaborators (not the current user).
 * Deduplicates by `savedAt` timestamp so the same save event is never
 * reported twice.
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
