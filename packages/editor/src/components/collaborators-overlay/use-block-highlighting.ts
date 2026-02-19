/**
 * WordPress dependencies
 */
import {
	privateApis as coreDataPrivateApis,
	SelectionType,
	type SelectionWholeBlock,
} from '@wordpress/core-data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from '../collab-sidebar/utils';

const { useActiveCollaborators } = unlock( coreDataPrivateApis );

/**
 * Custom hook for highlighting selected blocks in the editor
 * @param blockEditorDocument - Ref to the block editor document, used to directly style block elements.
 * @param postId              - The ID of the post
 * @param postType            - The type of the post
 */
export function useBlockHighlighting(
	blockEditorDocument: Document | null,
	postId: number | null,
	postType: string | null
) {
	const highlightedBlockIds = useRef< Set< string > >( new Set() );
	const userStates = useActiveCollaborators(
		postId ?? null,
		postType ?? null
	);

	// Draw block highlights
	useEffect( () => {
		// Don't do anything if editor is not rendered yet.
		if ( blockEditorDocument === null ) {
			return;
		}

		const unhighlightBlocks = ( blockIds: string[] ) => {
			blockIds.forEach( ( blockId ) => {
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
		};

		const blocksToHighlight = userStates
			.map( ( userState: any ) => {
				const isWholeBlockSelected =
					userState.editorState?.selection?.type ===
					SelectionType.WholeBlock;
				const shouldDrawUser = ! userState.isMe;

				if ( isWholeBlockSelected && shouldDrawUser ) {
					const selection = userState.editorState
						?.selection as unknown as SelectionWholeBlock;

					return {
						blockId: selection.blockId,
						color: getAvatarBorderColor(
							userState.collaboratorInfo.id
						),
					};
				}

				return null;
			} )
			.filter( ( block: any ) => block !== null );

		// Unhighlight blocks that are no longer highlighted.
		const selectedBlockIds = blocksToHighlight.map(
			( block: any ) => block.blockId
		);
		const blocksIdsToUnhighlight = Array.from(
			highlightedBlockIds.current
		).filter( ( blockId ) => ! selectedBlockIds.includes( blockId ) );

		unhighlightBlocks( blocksIdsToUnhighlight );

		// Highlight blocks that are currently highlighted.
		blocksToHighlight.forEach( ( blockColorPair: any ) => {
			const { color, blockId } = blockColorPair;
			const blockElement = getBlockElementById(
				blockEditorDocument,
				blockId
			);

			if ( ! blockElement ) {
				return;
			}

			if ( blockElement ) {
				blockElement.classList.add( 'is-collaborator-selected' );
				blockElement.style.setProperty(
					'--collaborator-outline-color',
					color
				);
				highlightedBlockIds.current.add( blockId );
			}
		} );
	}, [ userStates, blockEditorDocument ] );
}

const getBlockElementById = (
	blockEditorDocument: Document,
	blockId: string
): HTMLElement | null => {
	return blockEditorDocument.querySelector( `[data-block="${ blockId }"]` );
};
