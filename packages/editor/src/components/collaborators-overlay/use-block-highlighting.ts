import {
	privateApis as coreDataPrivateApis,
	type CoreDataPrivateApis,
	type PostEditorAwarenessState as ActiveCollaborator,
	type SelectionEndpoint,
} from '@wordpress/core-data';
// prettier-ignore
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from '../collab-sidebar/utils/display';
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

export interface BlockHighlightCollaborator {
	clientId: number;
	userName: string;
	avatarUrl?: string;
	color: string;
}

export interface BlockHighlightData {
	blockId: string;
	x: number;
	y: number;
	// The collaborators whose avatar sits above this block, in the order
	// they joined the session. A collaborator appears on one block only:
	// the first block of their selection.
	collaborators: BlockHighlightCollaborator[];
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
 * @param highlightTextBlocks - Whether a caret or text selection outlines the block it
 *                            sits in, and puts the collaborator's avatar above that
 *                            block. When false, text blocks are only outlined when
 *                            the caret has nowhere visible to draw.
 * @return Highlight data for rendering and a delayed recompute function.
 */
export function useBlockHighlighting(
	overlayElement: HTMLElement | null,
	blockEditorDocument: Document | null,
	postId: number | null,
	postType: string | null,
	delayMs: number,
	highlightTextBlocks: boolean
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
			// true: always outline. false: outline only on non-text blocks
			// (a text block in a multi-block range shows selection rects
			// instead, so its content stays readable).
			alwaysOutline: boolean;
		};

		const describeCollaborator = ( userState: ActiveCollaborator ) => {
			const userId = userState.collaboratorInfo.id ?? userState.clientId;
			return {
				clientId: userState.clientId,
				userId,
				color: getAvatarBorderColor( userId ),
				userName: getCollaboratorDisplayName(
					userState.collaboratorInfo
				),
				avatarUrl: getAvatarUrl(
					userState.collaboratorInfo.avatar_urls
				),
			};
		};

		// Walk collaborators in the order they joined, so that when several
		// of them share a block the outline color and the first avatar in
		// the stack stay with the same person as others come and go.
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
			.toSorted(
				( a, b ) =>
					a.collaboratorInfo.enteredAt -
						b.collaboratorInfo.enteredAt || a.clientId - b.clientId
			)
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
							...describeCollaborator( userState ),
							alwaysOutline: true,
						},
					];
				}

				if (
					selection.type === SelectionType.Cursor ||
					selection.type === SelectionType.SelectionInOneBlock
				) {
					// use-render-cursors draws these as a real caret or
					// text selection. With text block highlighting on, the
					// block holding that caret is outlined as well, and the
					// collaborator's avatar moves from the caret to the
					// block. Otherwise this hook only steps in when the
					// target is hidden inside collapsed content (e.g. a
					// closed core/details or an inactive core/accordion
					// panel), where a real caret has nowhere valid to draw:
					// the nearest *visible* ancestor block is outlined
					// instead, so collaborators still have a findable
					// presence indicator.
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
					if ( ! targetElement ) {
						return [];
					}
					if (
						! highlightTextBlocks &&
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
							...describeCollaborator( userState ),
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

				// Both endpoints in the same container (e.g. two list-items in one list).
				if ( sameContainer ) {
					return [
						{
							blockId: firstId,
							...describeCollaborator( userState ),
							alwaysOutline: highlightTextBlocks,
						},
					];
				}

				const intermediateIds = middleEls
					.map( ( el ) => el.getAttribute( 'data-block' ) )
					.filter( ( id ): id is string => Boolean( id ) );

				return [ firstId, ...intermediateIds, lastId ].map(
					( blockId ) => ( {
						blockId,
						...describeCollaborator( userState ),
						alwaysOutline: highlightTextBlocks,
					} )
				);
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

		// Highlight blocks and gather the avatars to stack above each one.
		// Measuring forces a layout, so skip it when there is nothing to place.
		const overlayRect =
			( blocksToHighlight.length &&
				overlayElement?.getBoundingClientRect() ) ||
			null;

		// Blocks already reset and checked for visibility in this pass. A
		// block appears once per collaborator in it; the first entry decides
		// the outline color.
		const visibleBlocks = new Map< string, HTMLElement >();
		const skippedBlocks = new Set< string >();

		// Track which users already have an avatar placed. Fallback collaborators
		// use their Yjs client ID, so anonymous sessions remain distinct while
		// multiple sessions for a named user stay grouped.
		const usersWithAvatar = new Set< number >();
		const avatarsByBlock = new Map<
			string,
			BlockHighlightCollaborator[]
		>();

		blocksToHighlight.forEach( ( block ) => {
			const { color, blockId, userName, avatarUrl, clientId } = block;

			if ( skippedBlocks.has( blockId ) ) {
				return;
			}

			let blockElement = visibleBlocks.get( blockId );
			if ( ! blockElement ) {
				const element = getBlockElementById(
					blockEditorDocument,
					blockId
				);
				if ( ! element ) {
					skippedBlocks.add( blockId );
					return;
				}

				// Reset any stale outline class first. Without this, a block
				// that transitions from a WholeBlock selection (always
				// outlined) to being a text block inside a
				// SelectionInMultipleBlocks range would keep the class
				// indefinitely — the cleanup loop only removes blocks that
				// leave the selection entirely.
				element.classList.remove( 'is-collaborator-selected' );
				element.style.removeProperty( '--collaborator-outline-color' );
				currentHighlightedIds.delete( blockId );

				// The block may be hidden inside collapsed content (e.g. a
				// closed core/details or an inactive core/accordion panel).
				// Skip drawing a new outline or avatar for it rather than
				// misplacing them at the collapsed wrapper's position — the
				// reset above still runs so a block that was outlined before
				// collapsing doesn't keep a stale outline class or dangling
				// entry in currentHighlightedIds.
				if ( ! isElementVisible( element ) ) {
					skippedBlocks.add( blockId );
					return;
				}

				visibleBlocks.set( blockId, element );
				blockElement = element;
			}

			// WholeBlock (single block entirely selected) and, with text
			// block highlighting on, a caret or text selection: always
			// outline. SelectionInMultipleBlocks: outline only on non-text
			// blocks (image, spacer, etc.) — text blocks are highlighted via
			// text rects from compute-selection so their content stays
			// visible.
			const isNonTextBlock = ! blockElement.innerText?.trim();
			if (
				! currentHighlightedIds.has( blockId ) &&
				( block.alwaysOutline || isNonTextBlock )
			) {
				blockElement.classList.add( 'is-collaborator-selected' );
				blockElement.style.setProperty(
					'--collaborator-outline-color',
					color
				);
				currentHighlightedIds.add( blockId );
			}

			if ( overlayRect && ! usersWithAvatar.has( block.userId ) ) {
				usersWithAvatar.add( block.userId );
				let avatars = avatarsByBlock.get( blockId );
				if ( ! avatars ) {
					avatars = [];
					avatarsByBlock.set( blockId, avatars );
				}
				avatars.push( { clientId, userName, avatarUrl, color } );
			}
		} );

		const results: BlockHighlightData[] = [];
		if ( overlayRect ) {
			for ( const [ blockId, collaborators ] of avatarsByBlock ) {
				const blockElement = visibleBlocks.get( blockId );
				if ( ! blockElement ) {
					continue;
				}
				const blockRect = blockElement.getBoundingClientRect();
				results.push( {
					blockId,
					collaborators,
					x: blockRect.left - overlayRect.left,
					y: blockRect.top - overlayRect.top,
				} );
			}
		}

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
		highlightTextBlocks,
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
