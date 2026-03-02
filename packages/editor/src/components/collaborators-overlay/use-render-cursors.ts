import {
	privateApis as coreDataPrivateApis,
	SelectionType,
} from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import type { ResolvedSelection } from '@wordpress/core-data';

import { unlock } from '../../lock-unlock';
import { getAvatarUrl } from './get-avatar-url';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { computeSelectionVisual } from './compute-selection';
import type { SelectionRect } from './cursor-dom-utils';

const { useActiveCollaborators, useResolvedSelection } =
	unlock( coreDataPrivateApis );

export type { SelectionRect };

export interface CursorData {
	userName: string;
	clientId: number;
	color: string;
	avatarUrl?: string;
	x: number;
	y: number;
	height: number;
	selectionRects?: SelectionRect[];
}

/**
 * Custom hook that computes cursor positions for each remote user in the editor.
 *
 * @param overlayElement      - The overlay element
 * @param blockEditorDocument - The block editor document
 * @param postId              - The ID of the post
 * @param postType            - The type of the post
 * @return An array of cursor data for rendering, and a function to trigger a delayed recompute.
 */
export function useRenderCursors(
	overlayElement: HTMLElement | null,
	blockEditorDocument: Document | null,
	postId: number | null,
	postType: string | null
): { cursors: CursorData[]; rerenderCursorsAfterDelay: () => () => void } {
	const sortedUsers = useActiveCollaborators(
		postId ?? null,
		postType ?? null
	);
	const resolveSelection = useResolvedSelection(
		postId ?? null,
		postType ?? null
	);

	const [ cursorPositions, setCursorPositions ] = useState< CursorData[] >(
		[]
	);

	const computeCursors = useMemo(
		() => () => {
			if ( ! overlayElement || ! blockEditorDocument ) {
				setCursorPositions( [] );
				return;
			}

			const cursorContext = {
				editorDocument: blockEditorDocument,
				overlay: overlayElement,
			};

			const cursors: CursorData[] = [];

			sortedUsers.forEach( ( user: any ) => {
				if ( user.isMe ) {
					return;
				}

				const selection = user.editorState?.selection ?? {
					type: SelectionType.None,
				};
				const userName = user.collaboratorInfo.name;
				const clientId = user.clientId;
				const color = getAvatarBorderColor( user.collaboratorInfo.id );
				const avatarUrl = getAvatarUrl(
					user.collaboratorInfo.avatar_urls
				);

				let start: ResolvedSelection = {
					textIndex: null,
					localClientId: null,
				};
				let end: ResolvedSelection | undefined;

				if ( selection.type === SelectionType.Cursor ) {
					start = resolveSelection( selection );
				} else if (
					selection.type === SelectionType.SelectionInOneBlock ||
					selection.type === SelectionType.SelectionInMultipleBlocks
				) {
					start = resolveSelection( {
						type: SelectionType.Cursor,
						cursorPosition: selection.cursorStartPosition,
					} );

					end = resolveSelection( {
						type: SelectionType.Cursor,
						cursorPosition: selection.cursorEndPosition,
					} );
				}

				const selectionVisual = computeSelectionVisual(
					selection,
					start,
					end,
					cursorContext
				);

				if ( selectionVisual.coords ) {
					const cursorData: CursorData = {
						userName,
						clientId,
						color,
						avatarUrl,
						...selectionVisual.coords,
					};

					if ( selectionVisual.selectionRects ) {
						cursorData.selectionRects =
							selectionVisual.selectionRects;
					}

					cursors.push( cursorData );
				}
			} );

			setCursorPositions( cursors );
		},
		[ blockEditorDocument, resolveSelection, overlayElement, sortedUsers ]
	);

	useEffect( computeCursors, [ computeCursors ] );

	const rerenderCursorsAfterDelay = useMemo(
		() => () => {
			const timeout = setTimeout( computeCursors, 500 );
			return () => clearTimeout( timeout );
		},
		[ computeCursors ]
	);

	return { cursors: cursorPositions, rerenderCursorsAfterDelay };
}
