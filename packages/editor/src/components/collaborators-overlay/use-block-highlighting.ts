/**
 * WordPress dependencies
 */
import {
	privateApis as coreDataPrivateApis,
	SelectionType,
} from '@wordpress/core-data';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from './avatar-colors';
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
	const userStates = useActiveCollaborators(
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

	const computeHighlights = useMemo(
		() => () => {
			if ( ! blockEditorDocument ) {
				setHighlights( [] );
				return;
			}

			const blocksToHighlight = userStates
				.map( ( userState: any ) => {
					const isWholeBlockSelected =
						userState.editorState?.selection?.type ===
						SelectionType.WholeBlock;
					const shouldDrawUser = ! userState.isMe;

					if ( isWholeBlockSelected && shouldDrawUser ) {
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
					}

					return null;
				} )
				.filter( ( block: any ) => block !== null );

			// Unhighlight blocks that are no longer selected.
			const selectedBlockIds = blocksToHighlight.map(
				( block: any ) => block.blockId
			);
			const blocksIdsToUnhighlight = Array.from(
				highlightedBlockIds.current
			).filter( ( blockId ) => ! selectedBlockIds.includes( blockId ) );

			blocksIdsToUnhighlight.forEach( ( blockId ) => {
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
			} );

			// Highlight blocks and compute positions for avatar labels.
			const results: BlockHighlightData[] = [];

			blocksToHighlight.forEach( ( block: any ) => {
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
		},
		[ userStates, blockEditorDocument, overlayElement, resolveSelection ]
	);

	useEffect( computeHighlights, [ computeHighlights ] );

	const rerenderHighlightsAfterDelay = useMemo(
		() => () => {
			const timeout = setTimeout( computeHighlights, 500 );
			return () => clearTimeout( timeout );
		},
		[ computeHighlights ]
	);

	return { highlights, rerenderHighlightsAfterDelay };
}

const getBlockElementById = (
	blockEditorDocument: Document,
	blockId: string
): HTMLElement | null => {
	return blockEditorDocument.querySelector( `[data-block="${ blockId }"]` );
};
