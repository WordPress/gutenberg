/**
 * WordPress dependencies
 */
import {
	privateApis as coreDataPrivateApis,
	type CoreDataPrivateApis,
	type PostEditorAwarenessState as ActiveCollaborator,
	type SelectionEndpoint,
} from '@wordpress/core-data';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { getAvatarUrl } from './get-avatar-url';
import {
	useDebouncedRecompute,
	useRequestAnimationFrameRecompute,
} from './use-debounced-recompute';
import { getOrderedBlockRange } from './cursor-dom-utils';

const { useActiveCollaborators, useResolvedSelection } =
	unlock( coreDataPrivateApis );
const { SelectionType } = unlock( coreDataPrivateApis ) as Pick<
	CoreDataPrivateApis,
	'SelectionType'
>;

export interface BlockHighlightData {
	blockId: string;
	clientId: number;
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
	rerenderHighlightsOnResize: () => void;
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
	// Separate token for resize events: fires on the next animation frame so
	// getBoundingClientRect() reflects the post-resize layout immediately.
	const [ resizeToken, rerenderHighlightsOnResize ] =
		useRequestAnimationFrameRecompute();

	// All DOM mutations and position computations live inside useEffect.
	useEffect( () => {
		if ( ! blockEditorDocument ) {
			setHighlights( [] );
			return;
		}

		// Capture the ref value so the cleanup closure sees the same Set
		// even if a later render replaces it.
		const currentHighlightedIds = highlightedBlockIds.current;

		type BlockEntry = {
			blockId: string;
			clientId: number;
			userId: number;
			color: string;
			userName: string;
			avatarUrl: string | undefined;
			// true for WholeBlock (always outline); false for
			// SelectionInMultipleBlocks (outline only on non-text blocks).
			alwaysOutline: boolean;
		};

		// Deduplicate by blockId — when multiple collaborators select the
		// same block, only the first one gets the highlight and avatar label.
		const seen = new Set< string >();
		const blocksToHighlight = userStates
			.filter( ( userState: ActiveCollaborator ) => {
				if ( userState.isMe ) {
					return false;
				}
				const selType = userState.editorState?.selection?.type;
				return (
					selType === SelectionType.WholeBlock ||
					selType === SelectionType.SelectionInMultipleBlocks
				);
			} )
			.flatMap< BlockEntry >( ( userState ) => {
				// Cast to any: the selection union type is narrowed by the
				// filter above, but TypeScript cannot infer that after .flatMap.
				const selection = userState.editorState?.selection as any;

				if ( selection.type === SelectionType.WholeBlock ) {
					let localClientId: string | null;
					try {
						( { localClientId } = resolveSelection( selection ) );
					} catch {
						return [];
					}
					if ( ! localClientId ) {
						return [];
					}
					return [
						{
							blockId: localClientId,
							clientId: userState.clientId,
							userId: userState.collaboratorInfo.id,
							color: getAvatarBorderColor(
								userState.collaboratorInfo.id
							),
							userName: userState.collaboratorInfo.name,
							avatarUrl: getAvatarUrl(
								userState.collaboratorInfo.avatar_urls
							),
							alwaysOutline: true,
						},
					];
				}

				// SelectionInMultipleBlocks: resolve each endpoint independently.
				const resolveEndpointId = (
					endpoint: SelectionEndpoint
				): string | null => {
					try {
						return resolveSelection( endpoint ).localClientId;
					} catch {
						return null;
					}
				};

				const startId = resolveEndpointId( selection.startEndpoint );
				const endId = resolveEndpointId( selection.endEndpoint );
				if ( ! startId || ! endId ) {
					return [];
				}

				const range = getOrderedBlockRange(
					startId,
					endId,
					blockEditorDocument
				);
				if ( ! range ) {
					return [];
				}

				const { firstId, lastId, middleEls, sameContainer } = range;
				const color = getAvatarBorderColor(
					userState.collaboratorInfo.id
				);
				const userName = userState.collaboratorInfo.name;
				const avatarUrl = getAvatarUrl(
					userState.collaboratorInfo.avatar_urls
				);

				// Both endpoints in the same container (e.g. two list-items in one list).
				if ( sameContainer ) {
					return [
						{
							blockId: firstId,
							clientId: userState.clientId,
							userId: userState.collaboratorInfo.id,
							color,
							userName,
							avatarUrl,
							alwaysOutline: false,
						},
					];
				}

				const intermediateIds = middleEls
					.map( ( el ) => el.getAttribute( 'data-block' ) )
					.filter( ( id ): id is string => Boolean( id ) );

				return [ firstId, ...intermediateIds, lastId ].map(
					( blockId ) => ( {
						blockId,
						clientId: userState.clientId,
						userId: userState.collaboratorInfo.id,
						color,
						userName,
						avatarUrl,
						alwaysOutline: false,
					} )
				);
			} )
			.filter( ( block ) => {
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

		// Track which users already have an avatar placed, keyed by WordPress
		// user ID. Blocks arrive in document order (top to bottom) so the first
		// block encountered per user is always the topmost visible one.
		const usersWithAvatar = new Set< number >();

		blocksToHighlight.forEach( ( block ) => {
			const { color, blockId, userName, avatarUrl } = block;
			const blockElement = getBlockElementById(
				blockEditorDocument,
				blockId
			);

			if ( ! blockElement ) {
				return;
			}

			// Reset any stale outline class first. Without this, a block that
			// transitions from a WholeBlock selection (always outlined) to being
			// a text block inside a SelectionInMultipleBlocks range would keep
			// the class indefinitely — the cleanup loop only removes blocks that
			// leave the selection entirely.
			blockElement.classList.remove( 'is-collaborator-selected' );
			blockElement.style.removeProperty( '--collaborator-outline-color' );
			currentHighlightedIds.delete( blockId );

			// WholeBlock (single block entirely selected): always outline.
			// SelectionInMultipleBlocks: outline only on non-text blocks
			// (image, spacer, etc.) — text blocks are highlighted via text
			// rects from compute-selection so their content stays visible.
			const isNonTextBlock = ! blockElement.innerText?.trim();
			if ( block.alwaysOutline || isNonTextBlock ) {
				blockElement.classList.add( 'is-collaborator-selected' );
				blockElement.style.setProperty(
					'--collaborator-outline-color',
					color
				);
				currentHighlightedIds.add( blockId );
			}

			if ( overlayRect && ! usersWithAvatar.has( block.userId ) ) {
				usersWithAvatar.add( block.userId );
				const blockRect = blockElement.getBoundingClientRect();
				results.push( {
					blockId,
					clientId: block.clientId,
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
		resizeToken,
		resolveSelection,
	] );

	return {
		highlights,
		rerenderHighlightsAfterDelay,
		rerenderHighlightsOnResize,
	};
}

const getBlockElementById = (
	blockEditorDocument: Document,
	blockId: string
): HTMLElement | null => {
	return blockEditorDocument.querySelector( `[data-block="${ blockId }"]` );
};
