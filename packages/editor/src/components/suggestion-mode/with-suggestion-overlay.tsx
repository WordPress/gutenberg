/**
 * Suggest-mode attribute-proposal HOC.
 *
 * With inline markers as the primary suggestion surface, this HOC covers the
 * edits that markers don't: primitive attribute changes (heading level,
 * alignment) and the rare content edit the marker path can't resolve
 * unambiguously. Those route through `wrappedSetAttributes` into the block's
 * own `metadata.suggestion.after` (see `marker.ts`): a persistent change the
 * undo stack owns, saved with the post and synced to peers, while the live
 * attributes stay at the baseline until Accept. Auto-save reads the marker to
 * build the suggestion's operations.
 *
 * A proposal and inline markers are mutually exclusive per attribute: a
 * proposal is marker-free by construction, so it renders in place of, and
 * hides, any marker living in that attribute. An edit that would do that is
 * declined at this seam rather than captured (`notifyEditRefused`), which is
 * what keeps a block from carrying both representations at once.
 *
 * Text and formatting edits never become proposals: typing, deletion, cut,
 * and single-line paste are caught on `beforeinput`/`cut`/`paste` by the
 * suggestion keyboards, and the remaining seams (committed IME composition,
 * autocorrect, drag-drop, multi-line paste, format toggles) are diverted to
 * inline markers by `maybeHandleFormatEdit` / `maybeHandleContentEdit` before
 * the proposal path runs. See #77867 for the original overlay tradeoff and
 * #73411 for the marker migration.
 */
import clsx from 'clsx';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRegistry, useSelect } from '@wordpress/data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { VisuallyHidden } from '@wordpress/ui';
import { useSuggestionSessionActions } from './suggestion-session';
import {
	mergeProposedAttributes,
	proposedAttributes,
	readSuggestionMarker,
	withProposedAttributes,
} from './marker';
import { STORE_NAME, EDITOR_INTENT_SUGGEST } from '../../store/constants';
import { unlock } from '../../lock-unlock';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import SuggestionMoveGhost from './suggestion-move-ghost';
import useMoveGhosts from './use-move-ghosts';
import {
	planFormatMarkers,
	planEditMarkers,
	hasSuggestionMarkers,
	stripSuggestionMarkersFromAttributes,
} from '../inline-suggestions';
import {
	isPartOfPendingInsertion,
	isPartOfPendingInsertionCached,
} from './store-interceptor';
import { notifyEditRefused } from './refuse-edit';

/**
 * True for plain strings and for objects that stringify to a meaningful HTML
 * form (the rich-text package's `RichTextData` is the case we care about).
 * Duck-typed against `toString` rather than `instanceof RichTextData` so we
 * don't take a hard dependency on the rich-text package's internal class.
 *
 * @param value Candidate attribute value.
 * @return True when `String( value )` will produce useful HTML.
 */
function isStringLike( value: any ): boolean {
	if ( typeof value === 'string' ) {
		return true;
	}
	return (
		value !== null &&
		value !== undefined &&
		typeof value.toString === 'function' &&
		value.toString !== Object.prototype.toString
	);
}

/**
 * Would turning this edit into a proposal hide a marker that is currently
 * rendering?
 *
 * A proposal stores marker-free values (see
 * `stripSuggestionMarkersFromAttributes`) and renders them in place of the
 * block's live values, so a proposal for an attribute whose live value
 * carries a `<mark class="wp-suggestion-<kind>">` suppresses every marker in it: the
 * earlier suggestion's note survives in the sidebar describing text the
 * reviewer can no longer see, and the block ends up carrying both
 * representations of a pending change at once (#73411, finding F-09).
 *
 * Compared per attribute rather than per block: an attribute-only suggestion
 * (heading level, alignment) on a block whose `content` holds a marker touches
 * neither the marked value nor its rendering, and still becomes a proposal.
 *
 * @param nextAttributes Attributes the block is trying to set.
 * @param prevAttributes The block's current attributes.
 * @return True when the proposal would strip a live marker.
 */
function proposalWouldHideMarkers(
	nextAttributes: Record< string, any > | null | undefined,
	prevAttributes: Record< string, any > | null | undefined
): boolean {
	for ( const key of Object.keys( nextAttributes ?? {} ) ) {
		if ( hasSuggestionMarkers( prevAttributes?.[ key ] ) ) {
			return true;
		}
	}
	return false;
}

/**
 * Inner renderer that diverts edits into proposals. Only mounted when the
 * editor is in `suggest` intent, so the session lookup, refs, and the edit
 * handlers don't run on every `BlockEdit` render for every block across the
 * entire editor when suggestions are inactive. This split matters for large
 * documents: in Edit/View intent the outer wrapper executes a single
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
	const { clientId, name, attributes, setAttributes } = props;
	const {
		requestFormatSuggestion,
		requestContentSuggestion,
		isDeferredInsertion,
		noteHistoryCapture,
	} = useSuggestionSessionActions();

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

	// The suggester's user id, forwarded to `maybeHandleContentEdit` so a
	// reconciled text edit opens its note under the right author. Defaults to
	// `null` for anonymous / pre-collab edits.
	const { authorId } = useSelect( ( select ) => {
		const core = select( coreStore );
		return { authorId: core?.getCurrentUser?.()?.id ?? null };
	}, [] );

	// The proposal is part of the attributes themselves, so it arrives with
	// every attribute update (undo, RTC sync, a decision) at no extra cost.
	const after = proposedAttributes( readSuggestionMarker( attributes ) );
	const mergedAttributes = useMemo(
		() => mergeProposedAttributes( attributes, after ),
		[ attributes, after ]
	);

	// What the block sees, kept current between renders as well: an updater
	// function passed to `setAttributes` (Table does this for cell edits)
	// must build on the previous update even when two land before a render.
	const mergedAttributesRef = useRef( mergedAttributes );
	useEffect( () => {
		mergedAttributesRef.current = mergedAttributes;
	}, [ mergedAttributes ] );

	// Detect a formatting-only edit (bold/italic/link toggled over a run, the
	// text unchanged) and hand it to the single-mount format handler, which
	// creates the note and writes a `format` marker to the live block instead
	// of routing the edit into the overlay diff. A format toggle arrives here
	// as a fresh `content` value with no earlier DOM event to intercept
	// (unlike typing, which the addition keyboard catches on `beforeinput`),
	// so this per-block `setAttributes` seam is the one point that covers every
	// source — toolbar button, keyboard shortcut, and the link popover alike.
	// Returns true only when the handler took ownership; with no handler
	// registered (isolated unit tests) it returns false and the edit falls
	// through to the overlay path.
	const maybeHandleFormatEdit = useCallback(
		(
			nextAttributes: Record< string, any >,
			prevAttributes: Record< string, any > | null | undefined
		) => {
			if (
				! nextAttributes ||
				! Object.prototype.hasOwnProperty.call(
					nextAttributes,
					'content'
				)
			) {
				return false;
			}
			const prevContent = prevAttributes?.content;
			const nextContent = nextAttributes.content;
			if (
				! isStringLike( prevContent ) ||
				! isStringLike( nextContent )
			) {
				return false;
			}
			// `authorId` lets the planner recognise the suggester's own
			// pending `format` marker on the run and extend it instead of
			// opening a second suggestion over the same words.
			const plan = planFormatMarkers( prevContent, nextContent, {
				authorId,
			} );
			/*
			 * Formatting over someone's formatting change, or across the edge
			 * of someone's addition, is declined here, naming whose
			 * suggestion is in the way. The toggle never reaches the block.
			 */
			if ( plan.kind === 'refuse' ) {
				notifyEditRefused( registry, {
					reason: plan.reason!,
					blocking: plan.blocking,
				} );
				return true;
			}
			if ( plan.kind !== 'format' ) {
				return false;
			}
			// `prevContent` rides along so the handler can re-validate the
			// live block content against the snapshot the plan was diffed
			// from before (and after) its async note round trip.
			return requestFormatSuggestion( {
				clientId,
				blockName: name,
				prevContent,
				nextContent,
				plan,
			} );
		},
		[ clientId, name, authorId, requestFormatSuggestion, registry ]
	);

	// Detect a text edit that reaches the block as a whole new `content` value
	// with no `beforeinput` for the typing/deletion keyboards to catch (a
	// committed IME composition, autocorrect, drag-drop, multi-line paste) and
	// hand it to the single-mount content reconciler, which turns it into inline
	// markers instead of an overlay diff. Only plans this converter can fully
	// execute — every action opens a fresh note (`insert-add`/`wrap-del`) — are
	// handed off; edits that grow or remove an existing marker, or that the diff
	// can't resolve unambiguously, return false and fall through to the overlay
	// path below. Returns true only when the reconciler took ownership; with no
	// handler registered (isolated unit tests) `requestContentSuggestion` returns
	// false and the edit falls through.
	const maybeHandleContentEdit = useCallback(
		(
			nextAttributes: Record< string, any >,
			prevAttributes: Record< string, any > | null | undefined
		) => {
			if (
				! nextAttributes ||
				! Object.prototype.hasOwnProperty.call(
					nextAttributes,
					'content'
				)
			) {
				return false;
			}
			const prevContent = prevAttributes?.content;
			const nextContent = nextAttributes.content;
			if (
				! isStringLike( prevContent ) ||
				! isStringLike( nextContent )
			) {
				return false;
			}
			const plan = planEditMarkers( prevContent, nextContent, {
				authorId,
			} );
			const actions = plan?.actions ?? [];
			/*
			 * Typing inside someone's addition or deletion, or deleting over
			 * someone's deletion, is declined, naming whose suggestion is in
			 * the way. Over the author's own markers the plan has no single
			 * marker to name, so the edit takes the path below, which
			 * declines it too.
			 */
			if (
				actions.length === 0 &&
				plan.refusal?.blocking &&
				plan.refusal.reason !== 'own-marker'
			) {
				notifyEditRefused( registry, plan.refusal );
				return true;
			}
			if ( actions.length === 0 ) {
				return false;
			}
			/*
			 * Only plans this seam can carry out end to end. Every action
			 * either opens its own note (`newNote`) or grows a marker that
			 * already has one (`grow-add`) — a `grow-add` is a revision of an
			 * existing proposal, so it needs no note work at all. An action
			 * that would retire a note (`remove-add`) is left to the paths that
			 * own that cleanup.
			 */
			if (
				! actions.every(
					( action ) => action.newNote || action.type === 'grow-add'
				)
			) {
				return false;
			}
			return requestContentSuggestion( {
				clientId,
				blockName: name,
				prevContent,
				plan,
			} );
		},
		[ clientId, name, authorId, requestContentSuggestion, registry ]
	);

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
			 * the real attributes instead of the overlay and the marker
			 * reconcilers:
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
					( isPartOfPendingInsertion( blockEditor, clientId ) ||
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
			// A formatting-only change becomes a live `format` marker rather
			// than a proposal; everything else (text edits, primitive
			// attribute changes) still routes to the proposal below.
			// The block-editor store holds the live value RichText renders (a
			// format-suggestion block keeps no proposal), so the block's
			// current attributes are the "before" side of the format diff.
			if ( maybeHandleFormatEdit( updates, attributesRef.current ) ) {
				return;
			}
			// A text edit that surfaced as a fresh `content` value (not caught
			// by the typing/deletion keyboards) becomes inline markers too, so
			// it never reaches the proposal path.
			if ( maybeHandleContentEdit( updates, attributesRef.current ) ) {
				return;
			}
			/*
			 * Last stop before the proposal: an edit that would bury a live
			 * marker under a clean whole-attribute value is declined
			 * instead. The keyboards decline the gestures they own before the
			 * browser applies them; this covers every other way an edit can
			 * reach a marked attribute (a format toggle over a marked run, a
			 * paste or IME commit the marker plan can't resolve), so the
			 * invariant holds however the edit arrived.
			 */
			if ( proposalWouldHideMarkers( updates, attributesRef.current ) ) {
				notifyEditRefused( registry );
				return;
			}
			mergedAttributesRef.current = {
				...mergedAttributesRef.current,
				...updates,
			};
			/*
			 * The proposal is written into the block's own marker, as a normal
			 * persistent change: it is the user's edit, so Ctrl+Z withdraws
			 * it, it saves with the post, and it syncs to peers. The live
			 * attributes stay at the baseline. Values are marker-stripped so
			 * accepting later can never resurrect another suggestion's mark.
			 */
			const { metadata } = withProposedAttributes( {
				metadata: attributesRef.current?.metadata,
				liveAttributes: attributesRef.current ?? {},
				changes: stripSuggestionMarkersFromAttributes( updates ),
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
			maybeHandleFormatEdit,
			maybeHandleContentEdit,
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
	const { attributes, setAttributes } = props;
	const registry = useRegistry();
	const after = proposedAttributes( readSuggestionMarker( attributes ) );
	const mergedAttributes = useMemo(
		() => mergeProposedAttributes( attributes, after ),
		[ attributes, after ]
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
						notifyEditRefused( registry );
						return;
					}
				}
			}
			setAttributes( nextAttributes );
		},
		[ registry, setAttributes ]
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
			const { isSuggestMode, isPendingInsert, hasProposal } = useSelect(
				( select ) => {
					// `getEditorIntent` is private while Suggest mode is
					// experimental.
					const suggesting =
						unlock( select( STORE_NAME ) ).getEditorIntent() ===
						EDITOR_INTENT_SUGGEST;
					const blockEditor: any = select( blockEditorStore );
					return {
						isSuggestMode: suggesting,
						// Only Suggest intent acts on it; skip the lookup
						// for every block in the other intents.
						isPendingInsert:
							suggesting &&
							isPartOfPendingInsertionCached(
								blockEditor,
								clientId
							),
						hasProposal: !! proposedAttributes(
							readSuggestionMarker(
								blockEditor?.getBlockAttributes?.( clientId )
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
 * HOC that tags the rendered block list item with a class whenever it has a
 * pending suggestion: an attribute proposal (renders the "bracket"
 * treatment) or a structural marker (renders strikethrough/dim/move
 * overlays), both stored in `metadata.suggestion`.
 *
 * Both are persisted on the live block (synced through the same path as
 * block content), so reviewers in Edit or View intent see and can act on
 * them too; that's the visual cue a post author needs to spot a pending
 * change at a glance.
 */
const withSuggestionBlockClassName = createHigherOrderComponent(
	( BlockListBlock ) =>
		function BlockListBlockWithSuggestionClass( props ) {
			const { clientId } = props;
			const moveGhosts = useMoveGhosts();
			const ghostsAfter = moveGhosts?.after?.get( clientId );
			const ghostsBefore = moveGhosts?.before?.get( clientId );
			const ghostsInside = moveGhosts?.insideParent?.get( clientId );
			const hasGhosts =
				( ghostsAfter && ghostsAfter.length > 0 ) ||
				( ghostsBefore && ghostsBefore.length > 0 ) ||
				( ghostsInside && ghostsInside.length > 0 );
			const { structuralClass, showBracket, authorId } = useSelect(
				( select ) => {
					const blockEditor: any = select( blockEditorStore );
					const marker = readSuggestionMarker(
						blockEditor?.getBlockAttributes?.( clientId )
					);
					return {
						structuralClass: structuralMarkerClass( marker?.type ),
						showBracket: !! proposedAttributes( marker ),
						authorId: marker?.authorId ?? null,
					};
				},
				[ clientId ]
			);
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
