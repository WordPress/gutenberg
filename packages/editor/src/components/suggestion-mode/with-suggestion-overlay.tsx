/**
 * Suggestion mode attribute-proposal HOC.
 *
 * Captures block edits made in Suggest intent: attribute changes route
 * through `wrappedSetAttributes` into the block's own
 * `metadata.suggestion.after` (see `marker.ts`): a persistent change the
 * undo stack owns, saved with the post and synced to peers, while the live
 * attributes stay at the baseline until Accept. Auto-save reads the marker to
 * build the suggestion's operations. The HOC also renders the pending
 * proposal merged over the live attributes, and the visual treatment for
 * proposals and structural markers.
 */
import clsx from 'clsx';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';
import { useSuggestionSessionActions } from './suggestion-session';
import {
	displayedProposal,
	mergeProposedAttributes,
	readSuggestionMarker,
	readSuggestionMarkers,
	withProposedAttributes,
} from './marker';
import { STORE_NAME, EDITOR_INTENT_SUGGEST } from '../../store/constants';
import { unlock } from '../../lock-unlock';
import {
	createPostOwnershipCheck,
	notifyForeignEditRefused,
} from './block-ownership';
import { findAttributeOperationProblem } from './operations';
import { getAvatarBorderColor } from '../collab-sidebar/utils/display';
import SuggestionMoveGhost from './suggestion-move-ghost';
import useMoveGhosts from './use-move-ghosts';
import {
	isPartOfPendingInsertion,
	isPartOfPendingInsertionCached,
} from './store-interceptor';

/**
 * The block's live attributes. `BlockListBlock` hands `BlockEdit` the
 * proposal merged over them (see `withSuggestionBlockClassName`), so the
 * baseline an edit is diffed against comes from the store.
 *
 * @param clientId Block client id.
 * @param fallback Attributes from props, for a block missing from the store.
 * @return Live attributes.
 */
function useLiveAttributes(
	clientId: string,
	fallback: Record< string, any >
): Record< string, any > {
	return (
		useSelect(
			( select ) =>
				( select( blockEditorStore ) as any ).getBlockAttributes(
					clientId
				),
			[ clientId ]
		) ?? fallback
	);
}

/**
 * Inner renderer that diverts edits into proposals. Only mounted when the
 * editor is in `suggest` intent, so the session lookup, refs, and the edit
 * handlers don't run on every `BlockEdit` render for every block across the
 * entire editor when suggestions are inactive. This split matters for large
 * documents: in Edit intent the outer wrapper executes a single
 * `useSelect` and renders the original `BlockEdit` untouched unless the block
 * carries a proposal (see `ProposedBlockEdit`).
 *
 * @param args           Arguments.
 * @param args.BlockEdit Wrapped edit component.
 * @param args.props     Props to forward to `BlockEdit`.
 */
function SuggestingBlockEdit( {
	BlockEdit,
	props,
}: {
	BlockEdit: any;
	props: any;
} ) {
	const { clientId, setAttributes } = props;
	const attributes = useLiveAttributes( clientId, props.attributes );
	const { isDeferredInsertion, noteHistoryCapture } =
		useSuggestionSessionActions();

	// Registry handle for the write-through check below; the live block
	// state is read at call time, not render time, so a block that was
	// tagged `pending-insert` a moment ago is honored even before the outer
	// wrapper's `useSelect` has re-rendered it into the pass-through branch.
	// Optional-chained because tests mount the HOC without a block-editor
	// store.
	const registry = useRegistry();

	// Track the latest attributes via a ref so the wrapped `setAttributes`
	// callback stays stable across renders. `useRef` seeds it with the initial
	// value, and this effect keeps it in sync after each commit so the callback
	// reads the current attributes without listing them as a dependency.
	const attributesRef = useRef( attributes );
	useEffect( () => {
		attributesRef.current = attributes;
	}, [ attributes ] );

	// The suggester's user id, recorded on a fresh marker. Defaults to `null`
	// for anonymous / pre-collab edits.
	const { authorId } = useSelect( ( select ) => {
		const core = select( coreStore );
		return { authorId: core?.getCurrentUser?.()?.id ?? null };
	}, [] );

	// The proposal is part of the attributes themselves, so it arrives with
	// every attribute update (undo, RTC sync, a decision) at no extra cost.
	const marker = readSuggestionMarker( attributes );
	// Every author's proposal on the block, later notes on top.
	const after = useMemo( () => displayedProposal( marker ), [ marker ] );
	const mergedAttributes = useMemo(
		() =>
			mergeProposedAttributes(
				attributes,
				displayableProposal( props.name, attributes, after )
			),
		[ props.name, attributes, after ]
	);

	// What the block sees, kept current between renders as well: an updater
	// function passed to `setAttributes` (Table does this for cell edits)
	// must build on the previous update even when two land before a render.
	const mergedAttributesRef = useRef( mergedAttributes );
	useEffect( () => {
		mergedAttributesRef.current = mergedAttributes;
	}, [ mergedAttributes ] );

	const wrappedSetAttributes = useCallback(
		(
			nextAttributes:
				| Record< string, any >
				| ( (
						current: Record< string, any >
				  ) => Record< string, any > )
		) => {
			/*
			 * Edits inside a block that IS the suggestion write through to
			 * the real attributes instead of a proposal:
			 * - A deferred insertion (an empty default block the interceptor
			 *   hasn't registered yet) receives its first content this way,
			 *   which is what triggers the interceptor to register the whole
			 *   block as a single `block-insert-after` suggestion.
			 * - A block tagged `pending-insert` (or nested inside one) has no
			 *   "before" state to preserve; the interceptor adopts the change
			 *   as the block's new baseline. Checked against the live store
			 *   because the outer pass-through branch only catches up after
			 *   its `useSelect` re-renders.
			 *
			 * A multi-selection update also goes to the real setter, which
			 * applies the change to every selected block. The store
			 * interceptor then turns each block's change into its own
			 * suggestion and restores the real attributes.
			 */
			const blockEditor = registry?.select?.( blockEditorStore );
			if (
				isDeferredInsertion( clientId ) ||
				( blockEditor &&
					( isPartOfPendingInsertion(
						blockEditor,
						clientId,
						authorId
					) ||
						blockEditor.getMultiSelectedBlockClientIds?.()?.length >
							0 ) )
			) {
				setAttributes( nextAttributes );
				return;
			}
			// An updater function builds on what the block sees now, overlay
			// included, so resolve it before any handler inspects the edit.
			const updates =
				typeof nextAttributes === 'function'
					? nextAttributes( mergedAttributesRef.current )
					: nextAttributes;
			mergedAttributesRef.current = {
				...mergedAttributesRef.current,
				...updates,
			};
			/*
			 * The proposal is written into the block's own marker, as a normal
			 * persistent change: it is the user's edit, so Ctrl+Z withdraws
			 * it, it saves with the post, and it syncs to peers. The live
			 * attributes stay at the baseline.
			 */
			const { metadata } = withProposedAttributes( {
				metadata: attributesRef.current?.metadata,
				liveAttributes: attributesRef.current ?? {},
				changes: updates,
				authorId,
			} );
			// Keep `attributesRef` ahead of the render so a second write in
			// the same tick folds into this marker instead of replacing it.
			attributesRef.current = { ...attributesRef.current, metadata };
			noteHistoryCapture();
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, { metadata } );
		},
		[
			clientId,
			authorId,
			noteHistoryCapture,
			isDeferredInsertion,
			setAttributes,
			registry,
		]
	);

	return (
		<BlockEdit
			{ ...props }
			attributes={ mergedAttributes }
			setAttributes={ wrappedSetAttributes }
		/>
	);
}

/**
 * Render half of the HOC: a block that carries a proposal shows it in every
 * intent, exactly as a pending removal or an inline marker does. Edits to
 * attributes that are not proposed go to the real setter and move the
 * baseline. An edit to a proposed attribute is declined: the canvas shows
 * the proposal, so the write would land on a value the author cannot see,
 * and a content proposal would be typed over into the live content. The
 * author accepts or rejects the suggestion first.
 *
 * @param args           Arguments.
 * @param args.BlockEdit Wrapped edit component.
 * @param args.props     Props to forward to `BlockEdit`.
 */
function ProposedBlockEdit( {
	BlockEdit,
	props,
}: {
	BlockEdit: any;
	props: any;
} ) {
	const { clientId, setAttributes } = props;
	const attributes = useLiveAttributes( clientId, props.attributes );
	const marker = readSuggestionMarker( attributes );
	// Every author's proposal on the block, later notes on top.
	const after = useMemo( () => displayedProposal( marker ), [ marker ] );
	const mergedAttributes = useMemo(
		() =>
			mergeProposedAttributes(
				attributes,
				displayableProposal( props.name, attributes, after )
			),
		[ props.name, attributes, after ]
	);
	const afterRef = useRef( after );
	useEffect( () => {
		afterRef.current = after;
	}, [ after ] );
	const guardedSetAttributes = useCallback(
		(
			nextAttributes:
				| Record< string, any >
				| ( (
						current: Record< string, any >
				  ) => Record< string, any > )
		) => {
			const proposed = afterRef.current;
			if ( proposed && typeof nextAttributes === 'object' ) {
				for ( const key of Object.keys( nextAttributes ) ) {
					if (
						Object.prototype.hasOwnProperty.call( proposed, key )
					) {
						return;
					}
				}
			}
			setAttributes( nextAttributes );
		},
		[ setAttributes ]
	);
	return (
		<BlockEdit
			{ ...props }
			attributes={ mergedAttributes }
			setAttributes={ guardedSetAttributes }
		/>
	);
}

/**
 * Suggest-intent half of the HOC for a block the current post does not own
 * (see `block-ownership.ts`): its attributes are saved in another entity,
 * where a proposal would never be reviewed, so an edit is declined instead
 * of captured or written through.
 *
 * @param args           Arguments.
 * @param args.BlockEdit Wrapped edit component.
 * @param args.props     Props to forward to `BlockEdit`.
 */
function ForeignBlockEdit( {
	BlockEdit,
	props,
}: {
	BlockEdit: any;
	props: any;
} ) {
	const registry = useRegistry();
	const attributesRef = useRef( props.attributes );
	useEffect( () => {
		attributesRef.current = props.attributes;
	}, [ props.attributes ] );
	const refuseSetAttributes = useCallback(
		(
			nextAttributes:
				| Record< string, any >
				| ( (
						current: Record< string, any >
				  ) => Record< string, any > )
		) => {
			const current = attributesRef.current ?? {};
			const updates =
				typeof nextAttributes === 'function'
					? nextAttributes( current )
					: nextAttributes;
			// A write that changes nothing (a block re-asserting a value on
			// mount) is not an edit to decline.
			const changes = Object.keys( updates ?? {} ).some(
				( key ) => updates[ key ] !== current[ key ]
			);
			if ( changes ) {
				notifyForeignEditRefused( registry );
			}
		},
		[ registry ]
	);
	return <BlockEdit { ...props } setAttributes={ refuseSetAttributes } />;
}

/**
 * HOC that diverts block edits into the block's proposal marker when the
 * editor is in the `suggest` intent, and renders a pending proposal merged
 * over the live attributes in every intent. The block's live attributes are
 * never mutated by a suggester; the block-editor store stays at the baseline
 * until the suggestion is accepted.
 *
 * For a block with no proposal in any other intent the HOC is a pass-through
 * and adds only a single `useSelect` call per block.
 */
const withSuggestionOverlay = createHigherOrderComponent(
	( BlockEdit ) =>
		function BlockEditWithSuggestionOverlay( props ) {
			const { clientId } = props;
			const { isSuggestMode, isForeign, isPendingInsert, hasProposal } =
				useSelect(
					( select ) => {
						// `getEditorIntent` is private while Suggest mode is
						// experimental.
						const blockEditor: any = select( blockEditorStore );
						// A block preview (the Template panel, a pattern
						// list) is its own block editor and holds nothing
						// of the post's to suggest on.
						const suggesting =
							unlock( select( STORE_NAME ) ).getEditorIntent() ===
								EDITOR_INTENT_SUGGEST &&
							! blockEditor?.getSettings?.()?.isPreviewMode;
						return {
							isSuggestMode: suggesting,
							isForeign:
								suggesting &&
								! createPostOwnershipCheck( { select } ).owns(
									clientId
								),
							// Only Suggest intent acts on it; skip the lookup
							// for every block in the other intents. Another
							// author's suggested block takes suggestions.
							isPendingInsert:
								suggesting &&
								isPartOfPendingInsertionCached(
									blockEditor,
									clientId,
									(
										select( coreStore ) as any
									 )?.getCurrentUser?.()?.id ?? null
								),
							hasProposal: !! displayedProposal(
								readSuggestionMarker(
									blockEditor?.getBlockAttributes?.(
										clientId
									)
								)
							),
						};
					},
					[ clientId ]
				);

			// A pending-insert block has no "before" state to preserve: the
			// block itself is the suggestion. Edits to it (and to blocks
			// nested inside it; the children of a suggested-in Group are
			// part of the Group's insertion) write through to the real
			// attributes so the content syncs via CRDT and renders on the
			// reviewer's canvas as part of the preview.
			if ( isForeign ) {
				return (
					<ForeignBlockEdit BlockEdit={ BlockEdit } props={ props } />
				);
			}
			if ( isSuggestMode && ! isPendingInsert ) {
				return (
					<SuggestingBlockEdit
						BlockEdit={ BlockEdit }
						props={ props }
					/>
				);
			}
			if ( hasProposal ) {
				return (
					<ProposedBlockEdit
						BlockEdit={ BlockEdit }
						props={ props }
					/>
				);
			}
			return <BlockEdit { ...props } />;
		},
	'withSuggestionOverlay'
);

/**
 * Map a `metadata.suggestion.type` marker to the class that drives the
 * structural-suggestion visual treatment. Keeps the marker → class lookup
 * in one place so the rendering layer stays a thin shell over the data
 * model.
 *
 * @param type Marker type.
 * @return Class name for the marker, or null when the type
 * is not a recognized structural marker.
 */
function structuralMarkerClass( type: string | undefined ): string | null {
	switch ( type ) {
		case 'pending-remove':
			return 'is-suggestion-pending-remove';
		case 'pending-insert':
			return 'is-suggestion-pending-insert';
		case 'pending-move':
			return 'is-suggestion-pending-move';
		default:
			return null;
	}
}

/**
 * The part of a proposal the canvas shows: the values accept would apply.
 * Any author of the post can write a marker, and the block's edit component
 * renders what it is handed, so a value accept refuses (an element name, a
 * URL scheme, an attribute the block type lacks) is left at its baseline.
 * The note still describes it, and accepting it is still refused.
 *
 * @param blockName  The block's name.
 * @param attributes The block's live attributes.
 * @param proposal   The proposal to display, if any.
 * @return The proposal without the values that fail, or null when none pass.
 */
function displayableProposal(
	blockName: string | null | undefined,
	attributes: Record< string, any >,
	proposal: Record< string, unknown > | null
): Record< string, unknown > | null {
	if ( ! proposal ) {
		return proposal;
	}
	const allowed = Object.entries( proposal ).filter(
		( [ attribute, after ] ) =>
			! findAttributeOperationProblem(
				blockName,
				[ { type: 'attribute-set', attribute, after } ],
				attributes
			)
	);
	if ( allowed.length === Object.keys( proposal ).length ) {
		return proposal;
	}
	return allowed.length > 0 ? Object.fromEntries( allowed ) : null;
}

/**
 * HOC that tags the rendered block list item with a class whenever it has a
 * pending suggestion: an attribute proposal (renders the "bracket"
 * treatment) or a structural marker (renders strikethrough/dim/move
 * overlays), both stored in `metadata.suggestion`.
 *
 * Both are persisted on the live block (synced through the same path as
 * block content), so reviewers in Edit intent see and can act on
 * them too; that's the visual cue a post author needs to spot a pending
 * change at a glance.
 */
const withSuggestionBlockClassName = createHigherOrderComponent(
	( BlockListBlock ) =>
		function BlockListBlockWithSuggestionClass( props ) {
			const { clientId } = props;
			const registry = useRegistry();
			const moveGhosts = useMoveGhosts();
			const ghostsAfter = moveGhosts?.after?.get( clientId );
			const ghostsBefore = moveGhosts?.before?.get( clientId );
			const ghostsInside = moveGhosts?.insideParent?.get( clientId );
			const hasGhosts =
				( ghostsAfter && ghostsAfter.length > 0 ) ||
				( ghostsBefore && ghostsBefore.length > 0 ) ||
				( ghostsInside && ghostsInside.length > 0 );
			const { structuralClass, showBracket, authorId, attributes } =
				useSelect(
					( select ) => {
						const blockEditor: any = select( blockEditorStore );
						const live =
							blockEditor?.getBlockAttributes?.( clientId );
						const marker = readSuggestionMarker( live );
						// A removal nested under another suggestion still strikes
						// the block through.
						const removal = readSuggestionMarkers( live ).find(
							( entry ) => entry.type === 'pending-remove'
						);
						return {
							structuralClass: structuralMarkerClass(
								removal?.type ?? marker?.type
							),
							showBracket: !! displayedProposal( marker ),
							authorId: ( removal ?? marker )?.authorId ?? null,
							attributes: live,
						};
					},
					[ clientId ]
				);
			/*
			 * Block supports (font size, colors, duotone, alignment) build
			 * the wrapper from these attributes, not from what `BlockEdit`
			 * renders, so the proposal has to go in here to be previewed.
			 */
			const previewAttributes = useMemo( () => {
				const proposal = showBracket
					? displayableProposal(
							props.name ??
								registry
									.select( blockEditorStore )
									.getBlockName( clientId ),
							attributes,
							displayedProposal(
								readSuggestionMarker( attributes )
							)
						)
					: null;
				return proposal
					? mergeProposedAttributes( attributes, proposal )
					: null;
			}, [ showBracket, attributes, props.name, registry, clientId ] );
			const isPendingMove =
				structuralClass === 'is-suggestion-pending-move';

			if ( ! showBracket && ! structuralClass && ! hasGhosts ) {
				return <BlockListBlock { ...props } />;
			}

			const renderGhosts = (
				list: any[] | undefined,
				keyPrefix: string
			) =>
				list?.map( ( moved: any ) => (
					<SuggestionMoveGhost
						key={ `${ keyPrefix }-${ moved.clientId }` }
						moved={ moved }
					/>
				) );

			// Apply the suggester's avatar color via a CSS custom property
			// so the canvas treatment (outline / strikethrough / label tab)
			// reads as that suggester's. Falls through to the green default
			// in CSS when `authorId` is missing.
			const wrapperStyle =
				authorId !== null
					? {
							...props.wrapperProps?.style,
							'--suggestion-author-color':
								getAvatarBorderColor( authorId ),
						}
					: props.wrapperProps?.style;

			const blockClassName =
				showBracket || structuralClass
					? clsx(
							props.className,
							showBracket && 'is-suggestion-pending',
							structuralClass
						)
					: props.className;

			return (
				<>
					{ renderGhosts( ghostsBefore, 'gb' ) }
					{ isPendingMove && (
						<VisuallyHidden>
							{ __( 'Suggested move destination.' ) }
						</VisuallyHidden>
					) }
					<BlockListBlock
						{ ...props }
						{ ...( previewAttributes && {
							attributes: previewAttributes,
						} ) }
						className={ blockClassName }
						wrapperProps={ {
							...props.wrapperProps,
							style: wrapperStyle,
							// Localized text for the CSS-rendered "Suggested
							// move" tab (see content-suggestion.scss); sighted
							// users in any locale read it from this attribute.
							...( isPendingMove && {
								'data-suggestion-move-label':
									__( 'Suggested move' ),
							} ),
						} }
					/>
					{ /* Ghosts for blocks that left this (now-empty) container,
					     rendered just below it since there's no surviving
					     child to anchor them to inside. */ }
					{ renderGhosts( ghostsInside, 'gi' ) }
					{ renderGhosts( ghostsAfter, 'ga' ) }
				</>
			);
		},
	'withSuggestionBlockClassName'
);

export { structuralMarkerClass, withSuggestionBlockClassName };

let filterRegistered = false;

/**
 * Register the filters. Idempotent: safe to call multiple times (hot reload,
 * dynamic imports).
 */
export function registerSuggestionOverlayFilter() {
	if ( filterRegistered ) {
		return;
	}
	filterRegistered = true;
	addFilter(
		'editor.BlockEdit',
		'core/editor/suggestion-mode-overlay',
		withSuggestionOverlay
	);
	addFilter(
		'editor.BlockListBlock',
		'core/editor/suggestion-mode-block-class',
		withSuggestionBlockClassName
	);
}

export default withSuggestionOverlay;
