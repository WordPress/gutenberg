/**
 * WordPress dependencies
 */
import {
	privateApis as coreDataPrivateApis,
	SelectionType,
	type PostEditorAwarenessState as ActiveCollaborator,
} from '@wordpress/core-data';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { getAvatarUrl } from './get-avatar-url';
import { useDebouncedRecompute } from './use-debounced-recompute';

const { useActiveCollaborators, useResolvedSelection } =
	unlock( coreDataPrivateApis );

export interface BlockHighlightData {
	blockId: string;
	userName: string;
	avatarUrl?: string;
	color: string;
	x: number;
	y: number;
}

/**
 * Custom hook for highlighting selected blocks in the editor and computing
 * their positions for rendering avatar labels in the overlay.
 *
 * @param overlayElement      - The overlay element used as position reference.
 * @param blockEditorDocument - Ref to the block editor document.
 * @param postId              - The ID of the post.
 * @param postType            - The type of the post.
 * @param delayMs             - Milliseconds to wait before recomputing highlight positions.
 * @return Highlight data for rendering and a delayed recompute function.
 */
export function useBlockHighlighting(
	overlayElement: HTMLElement | null,
	blockEditorDocument: Document | null,
	postId: number | null,
	postType: string | null,
	delayMs: number
): {
	highlights: BlockHighlightData[];
	rerenderHighlightsAfterDelay: () => () => void;
} {
	const highlightedBlockIds = useRef< Set< string > >( new Set() );
	const userStates: ActiveCollaborator[] = useActiveCollaborators(
		postId ?? null,
		postType ?? null
	);
	const resolveSelection = useResolvedSelection(
		postId ?? null,
		postType ?? null
	);

	const [ highlights, setHighlights ] = useState< BlockHighlightData[] >(
		[]
	);

	// Bump this counter to force the effect to re-run (e.g. after a layout shift).
	const [ recomputeToken, rerenderHighlightsAfterDelay ] =
		useDebouncedRecompute( delayMs );

	// All DOM mutations and position computations live inside useEffect.
	useEffect( () => {
		if ( ! blockEditorDocument ) {
			setHighlights( [] );
			return;
		}

		// Capture the ref value so the cleanup closure sees the same Set
		// even if a later render replaces it.
		const currentHighlightedIds = highlightedBlockIds.current;

		// Deduplicate by blockId — when multiple collaborators select the
		// same block, only the first one gets the highlight and avatar label.
		const seen = new Set< string >();
		const blocksToHighlight = userStates
			.filter( ( userState: ActiveCollaborator ) => {
				const isWholeBlockSelected =
					userState.editorState?.selection?.type ===
					SelectionType.WholeBlock;

				return ! userState.isMe && isWholeBlockSelected;
			} )
			.map( ( userState ) => {
				let localClientId;
				try {
					( { localClientId } = resolveSelection(
						userState.editorState?.selection
					) );
				} catch {
					return null;
				}

				if ( ! localClientId ) {
					return null;
				}

				return {
					blockId: localClientId,
					color: userState.isMe
						? 'var(--wp-admin-theme-color)'
						: getAvatarBorderColor( userState.collaboratorInfo.id ),
					userName: userState.collaboratorInfo.name,
					avatarUrl: getAvatarUrl(
						userState.collaboratorInfo.avatar_urls
					),
				};
			} )
			.filter( ( block ): block is NonNullable< typeof block > => {
				if ( ! block ) {
					return false;
				}
				if ( seen.has( block.blockId ) ) {
					return false;
				}
				seen.add( block.blockId );
				return true;
			} );

		// Unhighlight blocks that are no longer selected.
		const selectedBlockIds = new Set(
			blocksToHighlight.map( ( block ) => block.blockId )
		);

		for ( const blockId of currentHighlightedIds ) {
			if ( ! selectedBlockIds.has( blockId ) ) {
				const blockElement = getBlockElementById(
					blockEditorDocument,
					blockId
				);

				if ( blockElement ) {
					blockElement.classList.remove( 'is-collaborator-selected' );
					blockElement.style.removeProperty(
						'--collaborator-outline-color'
					);
				}

				currentHighlightedIds.delete( blockId );
			}
		}

		// Highlight blocks and compute positions for avatar labels.
		const results: BlockHighlightData[] = [];
		const overlayRect = overlayElement?.getBoundingClientRect() ?? null;

		blocksToHighlight.forEach( ( block ) => {
			const { color, blockId, userName, avatarUrl } = block;
			const blockElement = getBlockElementById(
				blockEditorDocument,
				blockId
			);

			if ( ! blockElement ) {
				return;
			}

			blockElement.classList.add( 'is-collaborator-selected' );
			blockElement.style.setProperty(
				'--collaborator-outline-color',
				color
			);
			currentHighlightedIds.add( blockId );

			if ( overlayRect ) {
				const blockRect = blockElement.getBoundingClientRect();

				results.push( {
					blockId,
					userName,
					avatarUrl,
					color,
					x: blockRect.left - overlayRect.left,
					y: blockRect.top - overlayRect.top,
				} );
			}
		} );

		setHighlights( results );

		// Clean up all highlights on unmount.
		return () => {
			for ( const blockId of currentHighlightedIds ) {
				const el = getBlockElementById( blockEditorDocument, blockId );
				if ( el ) {
					el.classList.remove( 'is-collaborator-selected' );
					el.style.removeProperty( '--collaborator-outline-color' );
				}
			}
			currentHighlightedIds.clear();
		};
	}, [
		userStates,
		blockEditorDocument,
		overlayElement,
		recomputeToken,
		resolveSelection,
	] );

	return { highlights, rerenderHighlightsAfterDelay };
}

const getBlockElementById = (
	blockEditorDocument: Document,
	blockId: string
): HTMLElement | null => {
	return blockEditorDocument.querySelector( `[data-block="${ blockId }"]` );
};
