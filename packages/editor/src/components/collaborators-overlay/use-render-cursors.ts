import { privateApis as coreDataPrivateApis } from '@wordpress/core-data';
import type {
	CoreDataPrivateApis,
	ResolvedSelection,
	SelectionEndpoint,
	PostEditorAwarenessState as ActiveCollaborator,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';

import { unlock } from '../../lock-unlock';
import { getAvatarUrl } from './get-avatar-url';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { computeSelectionVisual } from './compute-selection';
import { useDebouncedRecompute } from './use-debounced-recompute';
import type { SelectionRect } from './cursor-dom-utils';

const { useActiveCollaborators, useResolvedSelection } =
	unlock( coreDataPrivateApis );
const { SelectionType } = unlock( coreDataPrivateApis ) as Pick<
	CoreDataPrivateApis,
	'SelectionType'
>;

export type { SelectionRect };

export interface CursorData {
	userName: string;
	clientId: number;
	color: string;
	avatarUrl?: string;
	// x/y/height absent for multi-block selections — avatar comes from
	// use-block-highlighting; only selectionRects are rendered here.
	x?: number;
	y?: number;
	height?: number;
	isMe?: boolean;
	selectionRects?: SelectionRect[];
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

		// Pre-compute the overlay rect once, same for every user.
		const overlayRect = overlayElement.getBoundingClientRect();
		const overlayContext = {
			editorDocument: blockEditorDocument,
			overlayRect,
		};

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

			let start: ResolvedSelection = {
				richTextOffset: null,
				localClientId: null,
				attributeKey: null,
			};
			let end: ResolvedSelection | undefined;

			if ( selection.type === SelectionType.Cursor ) {
				try {
					start = resolveSelection( selection );
				} catch {
					// Selection may reference a stale Yjs position.
					return;
				}
			} else if ( selection.type === SelectionType.SelectionInOneBlock ) {
				try {
					start = resolveSelection( {
						type: SelectionType.Cursor,
						cursorPosition: selection.cursorStartPosition,
					} );
					end = resolveSelection( {
						type: SelectionType.Cursor,
						cursorPosition: selection.cursorEndPosition,
					} );
				} catch {
					// Selection may reference a stale Yjs position.
					return;
				}
			} else if (
				selection.type === SelectionType.SelectionInMultipleBlocks
			) {
				// Each endpoint is either a CursorEndpoint (character offset
				// inside a RichText field) or a WholeBlockEndpoint (block selected
				// as a unit, no character offset). Resolve independently so each
				// end uses the right Yjs anchor regardless of block type.
				const resolveEndpoint = (
					endpoint: SelectionEndpoint
				): ResolvedSelection =>
					endpoint.kind === 'cursor'
						? resolveSelection( {
								type: SelectionType.Cursor,
								cursorPosition: endpoint.cursorPosition,
						  } )
						: resolveSelection( {
								type: SelectionType.WholeBlock,
								blockPosition: endpoint.blockPosition,
						  } );
				try {
					start = resolveEndpoint( selection.startEndpoint );
					end = resolveEndpoint( selection.endEndpoint );
				} catch {
					// Selection may reference a stale Yjs position.
					return;
				}
			}

			const userName = user.collaboratorInfo.name;
			const clientId = user.clientId;
			const color = user.isMe
				? 'var(--wp-admin-theme-color)'
				: getAvatarBorderColor( user.collaboratorInfo.id );
			const avatarUrl = getAvatarUrl( user.collaboratorInfo.avatar_urls );

			const selectionVisual = computeSelectionVisual(
				selection,
				start,
				end,
				overlayContext
			);

			const hasCoords = Boolean( selectionVisual.coords );
			const hasRects =
				( selectionVisual.selectionRects?.length ?? 0 ) > 0;
			if ( hasCoords || hasRects ) {
				const cursorData: CursorData = {
					userName,
					clientId,
					color,
					avatarUrl,
					isMe: user.isMe,
					...( selectionVisual.coords ?? {} ),
				};
				if ( selectionVisual.selectionRects ) {
					cursorData.selectionRects = selectionVisual.selectionRects;
				}
				results.push( cursorData );
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
