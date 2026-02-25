/**
 * WordPress dependencies
 */
import {
	privateApis as coreDataPrivateApis,
	SelectionType,
	type PostEditorAwarenessState,
} from '@wordpress/core-data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { getAvatarUrl } from './get-avatar-url';

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
 * @return Highlight data for rendering and a delayed recompute function.
 */
export function useBlockHighlighting(
	overlayElement: HTMLElement | null,
	blockEditorDocument: Document | null,
	postId: number | null,
	postType: string | null
): {
	highlights: BlockHighlightData[];
	rerenderHighlightsAfterDelay: () => () => void;
} {
	const highlightedBlockIds = useRef< Set< string > >( new Set() );
	const userStates: PostEditorAwarenessState[] = useActiveCollaborators(
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
	const [ recomputeToken, setRecomputeToken ] = useState( 0 );

	// All DOM mutations and position computations live inside useEffect.
	useEffect( () => {
		if ( ! blockEditorDocument ) {
			setHighlights( [] );
			return;
		}

		const blocksToHighlight = userStates
			.filter(
				( userState ) =>
					! userState.isMe &&
					userState.editorState?.selection?.type ===
						SelectionType.WholeBlock
			)
			.map( ( userState ) => {
				const { localClientId } = resolveSelection(
					userState.editorState?.selection
				);

				if ( ! localClientId ) {
					return null;
				}

				return {
					blockId: localClientId,
					color: getAvatarBorderColor(
						userState.collaboratorInfo.id
					),
					userName: userState.collaboratorInfo.name,
					avatarUrl: getAvatarUrl(
						userState.collaboratorInfo.avatar_urls
					),
				};
			} )
			.filter( ( block ): block is NonNullable< typeof block > => {
				return block !== null;
			} );

		// Unhighlight blocks that are no longer selected.
		const selectedBlockIds = new Set(
			blocksToHighlight.map( ( block ) => block.blockId )
		);

		for ( const blockId of highlightedBlockIds.current ) {
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

				highlightedBlockIds.current.delete( blockId );
			}
		}

		// Highlight blocks and compute positions for avatar labels.
		const results: BlockHighlightData[] = [];

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
			highlightedBlockIds.current.add( blockId );

			if ( overlayElement ) {
				const blockRect = blockElement.getBoundingClientRect();
				const overlayRect = overlayElement.getBoundingClientRect();

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
			for ( const blockId of highlightedBlockIds.current ) {
				const el = getBlockElementById( blockEditorDocument, blockId );
				if ( el ) {
					el.classList.remove( 'is-collaborator-selected' );
					el.style.removeProperty( '--collaborator-outline-color' );
				}
			}
			highlightedBlockIds.current.clear();
		};
	}, [ userStates, blockEditorDocument, overlayElement, recomputeToken, resolveSelection ] );

	// The delayed rerender just bumps state — no direct DOM mutation.
	const rerenderHighlightsAfterDelay = useCallback( () => {
		const timeout = setTimeout( () => {
			setRecomputeToken( ( t ) => t + 1 );
		}, 500 );
		return () => clearTimeout( timeout );
	}, [] );

	return { highlights, rerenderHighlightsAfterDelay };
}

const getBlockElementById = (
	blockEditorDocument: Document,
	blockId: string
): HTMLElement | null => {
	return blockEditorDocument.querySelector( `[data-block="${ blockId }"]` );
};
