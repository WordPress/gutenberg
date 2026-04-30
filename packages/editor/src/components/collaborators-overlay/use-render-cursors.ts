import {
	privateApis as coreDataPrivateApis,
	SelectionType,
} from '@wordpress/core-data';
import type {
	ResolvedSelection,
	PostEditorAwarenessState as ActiveCollaborator,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

import { unlock } from '../../lock-unlock';
import { useDebouncedRecompute } from './use-debounced-recompute';

const { useActiveCollaborators, useResolvedSelection } =
	unlock( coreDataPrivateApis );

export interface CursorData {
	userName: string;
	clientId: number;
	color: string;
	x: number;
	y: number;
	height: number;
	isMe?: boolean;
}

/**
 * Custom hook that computes cursor positions for each remote user in the editor.
 *
 * @param overlayElement      - The overlay element
 * @param blockEditorDocument - The block editor document
 * @param postId              - The ID of the post
 * @param postType            - The type of the post
 * @param delayMs             - Milliseconds to wait before recomputing cursor positions.
 * @return An array of cursor data for rendering, and a function to trigger a delayed recompute.
 */
export function useRenderCursors(
	overlayElement: HTMLElement | null,
	blockEditorDocument: Document | null,
	postId: number | null,
	postType: string | null,
	delayMs: number
): { cursors: CursorData[]; rerenderCursorsAfterDelay: () => () => void } {
	const sortedUsers = useActiveCollaborators(
		postId ?? null,
		postType ?? null
	);
	const resolveSelection = useResolvedSelection(
		postId ?? null,
		postType ?? null
	);

	const showOwnCursor = useSelect(
		( select ) =>
			select( preferencesStore ).get( 'core', 'showCollaborationCursor' ),
		[]
	);

	const [ cursorPositions, setCursorPositions ] = useState< CursorData[] >(
		[]
	);

	// Bump this counter to force the effect to re-run (e.g. after a layout shift).
	const [ recomputeToken, rerenderCursorsAfterDelay ] =
		useDebouncedRecompute( delayMs );

	// All DOM position computations live inside useEffect.
	useEffect( () => {
		if ( ! overlayElement || ! blockEditorDocument ) {
			setCursorPositions( [] );
			return;
		}

		const results: CursorData[] = [];

		const hasOtherCollaborators = sortedUsers.some(
			( u: ActiveCollaborator ) => ! u.isMe
		);

		sortedUsers.forEach( ( user: ActiveCollaborator ) => {
			if ( user.isMe && ( ! showOwnCursor || ! hasOtherCollaborators ) ) {
				return;
			}

			const selection = user.editorState?.selection ?? {
				type: SelectionType.None,
			};

			let coords: {
				textIndex: null,
				y: number;
				height: number;
			} | null = null;

			if ( selection.type === SelectionType.None ) {
					const { textIndex, localClientId } =
				} catch {
					// Selection may reference a stale Yjs position.
				}
			} else if (
				selection.type === SelectionType.SelectionInOneBlock ||
				selection.type === SelectionType.SelectionInMultipleBlocks
			) {
				try {
					const { textIndex, localClientId } = resolveSelection( {
						type: SelectionType.Cursor,
						cursorPosition: selection.cursorStartPosition,
					} );
					if ( localClientId ) {
						coords = getCursorPosition(
							textIndex,
							localClientId,
							blockEditorDocument,
				} catch {
					// Selection may reference a stale Yjs position.
				}
			}

			if ( coords ) {
				results.push( {
				? 'var(--wp-admin-theme-color)'
				: getAvatarBorderColor( user.collaboratorInfo.id );
					userName,
					clientId,
					color,
					isMe: user.isMe,
					...coords,
				} );
			}
		} );

		setCursorPositions( results );
	}, [
		blockEditorDocument,
		resolveSelection,
		overlayElement,
		sortedUsers,
		showOwnCursor,
		recomputeToken,
	] );

	return { cursors: cursorPositions, rerenderCursorsAfterDelay };
}
