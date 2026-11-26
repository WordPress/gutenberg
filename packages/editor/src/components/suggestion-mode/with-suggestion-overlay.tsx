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
import { getBlockType } from '@wordpress/blocks';
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
 * The rich text an edit changes: a block's `content`, or any attribute its
 * type declares as rich text (an image caption, a quote citation).
 *
 * @param blockName      Block name.
 * @param nextAttributes Attributes the block is trying to set.
 * @param prevAttributes The block's current attributes.
 * @return The attribute with its value before and after, or null.
 */
function findRichTextEdit(
	blockName: string,
	nextAttributes: Record< string, any > | null | undefined,
	prevAttributes: Record< string, any > | null | undefined
): { attributeKey: string; prevContent: any; nextContent: any } | null {
	const definitions: Record< string, any > | undefined =
		getBlockType( blockName )?.attributes;
	for ( const attributeKey of Object.keys( nextAttributes ?? {} ) ) {
		const definition = definitions?.[ attributeKey ];
		if (
			attributeKey !== 'content' &&
			definition?.type !== 'rich-text' &&
			definition?.source !== 'rich-text'
		) {
			continue;
		}
		const prevContent = prevAttributes?.[ attributeKey ];
		const nextContent = nextAttributes?.[ attributeKey ];
		if (
			isStringLike( prevContent ) &&
			isStringLike( nextContent ) &&
			String( prevContent ) !== String( nextContent )
		) {
			return { attributeKey, prevContent, nextContent };
		}
	}
	return null;
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
	const { clientId, name, setAttributes } = props;
	const attributes = useLiveAttributes( clientId, props.attributes );
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

	// Detect a formatting-only edit (bold/italic/link toggled over a run, the
	// text unchanged) and hand it to the single-mount format handler, which
	// creates the note and writes a `format` marker to the live block instead
	// of routing the edit into the overlay diff. A format toggle arrives here
	// as a fresh rich text value with no earlier DOM event to intercept
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
			const edit = findRichTextEdit(
				name,
				nextAttributes,
				prevAttributes
			);
			if ( ! edit ) {
				return false;
			}
			const { attributeKey, prevContent, nextContent } = edit;
			// `authorId` lets the planner recognise the suggester's own
			// pending `format` marker on the run and extend it instead of
			// opening a second suggestion over the same words.
			const plan = planFormatMarkers( prevContent, nextContent, {
				authorId,
			} );
			if ( plan.kind !== 'format' && plan.kind !== 'unrecorded' ) {
				return false;
			}
			// `prevContent` rides along so the handler can re-validate the
			// live block content against the snapshot the plan was diffed
			// from before (and after) its async note round trip.
			return requestFormatSuggestion( {
				clientId,
				blockName: name,
				attributeKey,
				prevContent,
				nextContent,
				plan,
			} );
		},
		[ clientId, name, authorId, requestFormatSuggestion ]
	);

	// Detect a text edit that reaches the block as a whole new rich text value
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
			const edit = findRichTextEdit(
				name,
				nextAttributes,
				prevAttributes
			);
			if ( ! edit ) {
				return false;
			}
			const { attributeKey, prevContent, nextContent } = edit;
			const plan = planEditMarkers( prevContent, nextContent, {
				authorId,
			} );
			const actions = plan?.actions ?? [];
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
				attributeKey,
				prevContent,
				plan,
			} );
		},
		[ clientId, name, authorId, requestContentSuggestion ]
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
	const { clientId, setAttributes } = props;
	const attributes = useLiveAttributes( clientId, props.attributes );
	const registry = useRegistry();
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
