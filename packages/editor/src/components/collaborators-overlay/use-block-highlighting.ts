import {
	privateApis as coreDataPrivateApis,
	type CoreDataPrivateApis,
	type PostEditorAwarenessState as ActiveCollaborator,
	type SelectionEndpoint,
} from '@wordpress/core-data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { getAvatarUrl } from './get-avatar-url';
import {
	useDebouncedRecompute,
	useRequestAnimationFrameRecompute,
} from './use-debounced-recompute';
import {
	getNearestVisibleBlockAncestor,
	getOrderedBlockRange,
} from './cursor-dom-utils';
import { resolveTargetElement } from './compute-selection';
import { resolveStartPosition } from './resolve-start-position';
import { getCollaboratorDisplayName } from '../../utils/get-collaborator-display-name';

const { useActiveCollaborators, useResolvedSelection } =
	unlock( coreDataPrivateApis );
const { isElementVisible } = unlock( blockEditorPrivateApis );
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
					selType === SelectionType.SelectionInMultipleBlocks ||
					selType === SelectionType.Cursor ||
					selType === SelectionType.SelectionInOneBlock
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

					// The selected block may be hidden inside collapsed
					// content (e.g. a closed core/details or an inactive
					// core/accordion panel). Fall back to outlining the
					// nearest *visible* ancestor instead, same as the
					// Cursor/SelectionInOneBlock case below, so the
					// collaborator still has a findable presence indicator
					// rather than silently getting no highlight at all.
					let blockId = localClientId;
					const blockElement = getBlockElementById(
						blockEditorDocument,
						localClientId
					);
					if ( blockElement && ! isElementVisible( blockElement ) ) {
						const container =
							getNearestVisibleBlockAncestor( blockElement );
						const containerId =
							container?.getAttribute( 'data-block' );
						if ( ! containerId ) {
							return [];
						}
						blockId = containerId;
					}

					return [
						{
							blockId,
							clientId: userState.clientId,
							userId:
								userState.collaboratorInfo.id ??
								userState.clientId,
							color: getAvatarBorderColor(
								userState.collaboratorInfo.id ??
									userState.clientId
							),
							userName: getCollaboratorDisplayName(
								userState.collaboratorInfo
							),
							avatarUrl: getAvatarUrl(
								userState.collaboratorInfo.avatar_urls
							),
							alwaysOutline: true,
						},
					];
				}

				if (
					selection.type === SelectionType.Cursor ||
					selection.type === SelectionType.SelectionInOneBlock
				) {
					// These normally render as a real cursor/selection via
					// use-render-cursors — this hook only needs to step in
					// when the target is hidden inside collapsed content
					// (e.g. a closed core/details or an inactive
					// core/accordion panel), where a real cursor has nowhere
					// valid to draw. In that case, fall back to outlining
					// and placing an avatar on the nearest *visible*
					// ancestor block, so collaborators still have a
					// findable presence indicator.
					const resolved = resolveStartPosition(
						selection,
						resolveSelection
					);
					if ( ! resolved?.localClientId ) {
						return [];
					}
					const targetElement = resolveTargetElement(
						blockEditorDocument,
						resolved
					);
					if (
						! targetElement ||
						isElementVisible( targetElement )
					) {
						return [];
					}
					const container =
						getNearestVisibleBlockAncestor( targetElement );
					const containerId = container?.getAttribute( 'data-block' );
					if ( ! containerId ) {
						return [];
					}
					return [
						{
							blockId: containerId,
							clientId: userState.clientId,
							userId:
								userState.collaboratorInfo.id ??
								userState.clientId,
							color: getAvatarBorderColor(
								userState.collaboratorInfo.id ??
									userState.clientId
							),
							userName: getCollaboratorDisplayName(
								userState.collaboratorInfo
							),
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
					userState.collaboratorInfo.id ?? userState.clientId
				);
				const userName = getCollaboratorDisplayName(
					userState.collaboratorInfo
				);
				const avatarUrl = getAvatarUrl(
					userState.collaboratorInfo.avatar_urls
				);

				// Both endpoints in the same container (e.g. two list-items in one list).
				if ( sameContainer ) {
					return [
						{
							blockId: firstId,
							clientId: userState.clientId,
							userId:
								userState.collaboratorInfo.id ??
								userState.clientId,
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
						userId:
							userState.collaboratorInfo.id ?? userState.clientId,
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

		// Track which users already have an avatar placed. Fallback collaborators
		// use their Yjs client ID, so anonymous sessions remain distinct while
		// multiple sessions for a named user stay grouped.
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

			// The block may be hidden inside collapsed content (e.g. a closed
			// core/details or an inactive core/accordion panel). Skip drawing
			// a new outline or avatar for it rather than misplacing them at
			// the collapsed wrapper's position — the reset above still runs so
			// a block that was outlined before collapsing doesn't keep a
			// stale outline class or dangling entry in currentHighlightedIds.
			if ( ! isElementVisible( blockElement ) ) {
				return;
			}

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
