/**
 * Garbage collection for orphaned suggestion notes.
 *
 * Every suggestion note is anchored to something the user can see: an inline
 * `<mark class="wp-suggestion">` marker in block content, a structural
 * `metadata.suggestion` marker on a block, or a pending attribute entry in
 * the suggestion overlay. When the anchor disappears without the note being
 * resolved — the classic case is Ctrl+Z right after making the suggestion,
 * but deleting the marked text in Editing intent lands here too — the note
 * has nothing left to accept or reject. Leaving it behind produces the
 * orphaned-note problem called out in
 * `docs/explanations/architecture/suggestions.md`: a pending suggestion in
 * the sidebar whose Apply/Reject can no longer do anything.
 *
 * This component watches the anchor of every unresolved suggestion note and
 * trashes a note when an anchor it has previously observed disappears.
 * Transition-based on purpose: a note whose anchor was never seen (editor
 * still loading, marker write still in flight) is never collected, so load
 * order can't mass-trash healthy suggestions.
 *
 * Redo support: when an inline marker withdrawn by undo reappears (Ctrl+
 * Shift+Z), the trashed note is restored to pending so the marker stays
 * resolvable. Structural redo instead re-lands as a real edit under the
 * undo guard's adoption token (see suggestion-undo-guard.js).
 *
 * Deliberate-removal races are excluded two ways: apply/reject decisions
 * register their comment id as in flight (provider.js) for their duration,
 * and the note's local record must still be pending (`status: 'hold'`, no
 * `_wp_suggestion_status`) at collection time.
 */
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSuggestionOverlay } from './overlay-context';
import {
	findInlineOp,
	findStructuralOp,
	forgetResolvedSuggestion,
	getSuggestionsResolvedThisSession,
	isSuggestionDecisionInFlight,
	parseSuggestionPayload,
	rememberResolvedSuggestion,
} from './provider';
import { SUGGESTION_CLASS } from '../inline-suggestions';
import { getNoteIdsFromMetadata } from '../collab-sidebar/utils';
import { store as editorStore } from '../../store';
import { useNoteThreads } from '../collab-sidebar/hooks';

/*
 * Grace period between observing an anchor's disappearance and trashing the
 * note. Absorbs transient states (multi-dispatch undo application, a marker
 * moving between blocks) and gives the fire-time recheck a settled tree.
 */
const GC_GRACE_MS = 500;

/*
 * A trash request that fails is retried a bounded number of times. Without a
 * retry a transient REST failure strands the note: the effect only re-runs on
 * a presence change, and once the editor is closed the anchor counts as never
 * observed, so no later session collects it.
 */
const GC_RETRY_MS = 5000;
const GC_MAX_ATTEMPTS = 3;

/**
 * The id attribute of a serialized inline marker. Matched on the serialized
 * value rather than parsed: the index below runs on every block-editor store
 * update, and every marker carries the attribute, so a match can miss no
 * marker that is present.
 */
const SUGGESTION_ID_PATTERN = /data-suggestion-id="([^"]+)"/g;

const PENDING_MARKER_BY_OP: Record< string, string > = {
	'block-remove': 'pending-remove',
	'block-insert-after': 'pending-insert',
	'block-move': 'pending-move',
};

/**
 * Describe the anchor a suggestion note must keep to stay meaningful.
 *
 * @param note Note comment record.
 * @return Anchor descriptor, or null when the note is not a pending suggestion
 * this collector manages.
 */
function describeAnchor( note: any ) {
	const payload = parseSuggestionPayload( note?.meta?._wp_suggestion );
	if ( ! payload ) {
		return null;
	}
	const structuralOp = findStructuralOp( payload.operations );
	if ( structuralOp ) {
		return {
			kind: 'structural',
			pendingType: PENDING_MARKER_BY_OP[ structuralOp.type ],
		};
	}
	const inlineOp = findInlineOp( payload.operations );
	if ( inlineOp ) {
		return { kind: 'inline', attribute: inlineOp.attribute };
	}
	// Attribute-set suggestions: anchored to their overlay entry. Their
	// note lifecycle is normally owned by the auto-saver (which trashes a
	// note when the overlay reverts to baseline); the collector only covers
	// the entry being pruned wholesale (block deleted outside Suggest mode).
	return { kind: 'attribute' };
}

/**
 * The anchors present in the editor, indexed in one pass over the blocks.
 *
 * Structural anchors are the `metadata.suggestion` markers, keyed by pending
 * type and note id. Inline anchors are the marker ids found in each block's
 * rich-text attributes, keyed by attribute: the marker travels with content,
 * so the content is what is scanned rather than a (possibly undone) metadata
 * linkage. Building the index once and testing every note against it keeps a
 * store update at one serialization per block instead of one per note.
 *
 * @param blockEditor      Block-editor selectors.
 * @param inlineAttributes Attribute names any tracked inline note anchors to.
 * @return The index.
 */
function buildAnchorIndex(
	blockEditor: any,
	inlineAttributes: Set< string >
): { inline: Map< string, Set< string > >; structural: Set< string > } {
	const inline = new Map< string, Set< string > >();
	const structural = new Set< string >();
	for ( const clientId of blockEditor.getClientIdsWithDescendants?.() ??
		[] ) {
		const attributes = blockEditor.getBlockAttributes( clientId );
		if ( ! attributes ) {
			continue;
		}
		const pendingType = attributes.metadata?.suggestion?.type;
		if ( pendingType ) {
			for ( const noteId of getNoteIdsFromMetadata(
				attributes.metadata
			) ) {
				structural.add( `${ pendingType }:${ noteId }` );
			}
		}
		for ( const attribute of inlineAttributes ) {
			const value = attributes[ attribute ];
			const html =
				typeof value === 'string' ? value : value?.toHTMLString?.();
			if ( ! html || ! html.includes( SUGGESTION_CLASS ) ) {
				continue;
			}
			let ids = inline.get( attribute );
			if ( ! ids ) {
				ids = new Set();
				inline.set( attribute, ids );
			}
			for ( const match of html.matchAll( SUGGESTION_ID_PATTERN ) ) {
				ids.add( match[ 1 ] );
			}
		}
	}
	return { inline, structural };
}

type AnchorIndex = ReturnType< typeof buildAnchorIndex >;

/**
 * The rich-text attributes the given notes' inline anchors live in.
 *
 * @param lists Lists of tracked notes with their anchors.
 * @return Attribute names.
 */
function inlineAttributesOf(
	...lists: Array< Iterable< { anchor: any } > >
): Set< string > {
	const attributes = new Set< string >();
	for ( const list of lists ) {
		for ( const { anchor } of list ) {
			if ( anchor.kind === 'inline' ) {
				attributes.add( anchor.attribute );
			}
		}
	}
	return attributes;
}

/**
 * Whether a note's anchor is currently present in the editor.
 *
 * @param note    Note comment record.
 * @param anchor  Anchor descriptor from `describeAnchor`.
 * @param index   Anchor index from `buildAnchorIndex`.
 * @param entries Suggestion overlay entries.
 * @return True when the anchor exists.
 */
function isAnchorPresent(
	note: any,
	anchor: any,
	index: AnchorIndex,
	entries: any
): boolean {
	const idKey = String( note.id );
	if ( anchor.kind === 'attribute' ) {
		return Object.values( entries ?? {} ).some(
			( entry: any ) =>
				entry.commentId !== null &&
				entry.commentId !== undefined &&
				String( entry.commentId ) === idKey
		);
	}
	if ( anchor.kind === 'structural' ) {
		return index.structural.has( `${ anchor.pendingType }:${ idKey }` );
	}
	return index.inline.get( anchor.attribute )?.has( idKey ) ?? false;
}

/**
 * Invisible component that trashes suggestion notes whose anchor disappears
 * and restores inline notes whose marker comes back (redo). Mounted for
 * every intent — withdrawals can happen outside Suggest mode too.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionNoteGC() {
	const postId = useSelect(
		( select ) => select( editorStore ).getCurrentPostId(),
		[]
	);
	const { notes } = useNoteThreads( postId );
	const { entries, clearOverlay } = useSuggestionOverlay();
	const { saveEntityRecord } = useDispatch( coreStore );
	const registry = useRegistry();

	// Pending suggestion root notes only; replies and resolved notes have no
	// anchor contract.
	const suggestionNotes: Array< { note: any; anchor: any } > = [];
	/*
	 * Notes this session applied or rejected. Their marker should be gone; if
	 * it is back, an undo walked the block half of the decision back while the
	 * note stayed resolved, and the note has to follow (#73411, F-18).
	 */
	const resolvedNotes: Array< { note: any; anchor: any } > = [];
	const resolvedIds = getSuggestionsResolvedThisSession();
	for ( const note of notes ?? [] ) {
		if ( note.parent !== 0 ) {
			continue;
		}
		const anchor = describeAnchor( note );
		if ( ! anchor ) {
			continue;
		}
		if ( note.status === 'hold' ) {
			suggestionNotes.push( { note, anchor } );
		} else if ( resolvedIds.has( String( note.id ) ) ) {
			resolvedNotes.push( { note, anchor } );
		}
	}

	// Notes this collector trashed, kept so a marker restored by redo can
	// resurrect its note. Version state re-runs the presence probe below
	// when the map changes.
	const trashedRef = useRef(
		new Map< string, { note: any; anchor: any } >()
	);
	const [ trashedVersion, setTrashedVersion ] = useState( 0 );

	/*
	 * Latest render's values, read by the collector effect below rather than
	 * listed in its deps - the effect must run on a presence change, not on
	 * every note or block edit. Written in an effect of their own, declared
	 * first so the collector sees this render's values.
	 */
	const entriesRef = useRef( entries );
	const resolvedNotesRef = useRef( resolvedNotes );
	const clearOverlayRef = useRef( clearOverlay );
	useEffect( () => {
		entriesRef.current = entries;
		resolvedNotesRef.current = resolvedNotes;
		clearOverlayRef.current = clearOverlay;
	} );

	/*
	 * Reactive presence signature. Computed inside `useSelect` so it updates
	 * whenever block content changes (a marker can disappear without the
	 * notes list changing). Mirrors the signature pattern in
	 * annotate-suggestions.js.
	 */
	const presenceSignature = useSelect(
		( select ) => {
			const index = buildAnchorIndex(
				select( blockEditorStore ),
				inlineAttributesOf(
					suggestionNotes,
					trashedRef.current.values(),
					resolvedNotes
				)
			);
			const parts = [];
			for ( const { note, anchor } of suggestionNotes ) {
				parts.push(
					`${ note.id }:${
						isAnchorPresent( note, anchor, index, entries ) ? 1 : 0
					}`
				);
			}
			for ( const [ idKey, info ] of trashedRef.current ) {
				parts.push(
					`t${ idKey }:${
						isAnchorPresent(
							info.note,
							info.anchor,
							index,
							entries
						)
							? 1
							: 0
					}`
				);
			}
			for ( const { note, anchor } of resolvedNotes ) {
				parts.push(
					`r${ note.id }:${
						isAnchorPresent( note, anchor, index, entries ) ? 1 : 0
					}`
				);
			}
			return parts.join( '|' );
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ notes, entries, trashedVersion ]
	);

	// Anchors observed at least once this session, keyed by note id.
	const seenRef = useRef( new Set() );
	// Scheduled collections, keyed by note id.
	const timersRef = useRef( new Map() );

	useEffect( () => {
		const blockEditor = registry.select( blockEditorStore );
		const timers = timersRef.current;
		const indexAnchors = () =>
			buildAnchorIndex(
				blockEditor,
				inlineAttributesOf(
					suggestionNotes,
					trashedRef.current.values(),
					resolvedNotesRef.current
				)
			);
		const index = indexAnchors();

		const collect = ( note: any, anchor: any, attempt = 1 ) => {
			timers.delete( String( note.id ) );
			// Recheck against settled state: the anchor may be back (redo
			// beat the grace period) or the note may have been decided.
			if (
				isAnchorPresent(
					note,
					anchor,
					indexAnchors(),
					entriesRef.current
				)
			) {
				return;
			}
			if ( isSuggestionDecisionInFlight( note.id ) ) {
				return;
			}
			const record: any = registry
				.select( coreStore )
				.getEntityRecord( 'root', 'comment', note.id );
			const lifecycleStatus = record?.meta?._wp_suggestion_status;
			if (
				! record ||
				record.status !== 'hold' ||
				( lifecycleStatus && lifecycleStatus !== 'pending' )
			) {
				return;
			}
			saveEntityRecord(
				'root',
				'comment',
				{ id: note.id, status: 'trash' },
				{ throwOnError: true }
			)
				.then( () => {
					seenRef.current.delete( String( note.id ) );
					if ( anchor.kind === 'inline' ) {
						trashedRef.current.set( String( note.id ), {
							note,
							anchor,
						} );
						setTrashedVersion( ( version ) => version + 1 );
					}
					// Drop the stale overlay entry (structural op or
					// attribute baseline) so a later edit on the same block
					// can't resurrect the withdrawn note's operations.
					for ( const [ clientId, entry ] of Object.entries(
						entriesRef.current
					) ) {
						if (
							entry.commentId !== null &&
							entry.commentId !== undefined &&
							String( entry.commentId ) === String( note.id )
						) {
							clearOverlayRef.current( clientId );
						}
					}
				} )
				.catch( () => {
					// A transient REST failure must not strand the note:
					// retry while the anchor is still absent, a bounded
					// number of times.
					if ( attempt < GC_MAX_ATTEMPTS ) {
						timers.set(
							String( note.id ),
							// eslint-disable-next-line @wordpress/react-no-unsafe-timeout -- Tracked in `timersRef`, cleared on unmount.
							setTimeout(
								() => collect( note, anchor, attempt + 1 ),
								GC_RETRY_MS
							)
						);
					}
				} );
		};

		for ( const { note, anchor } of suggestionNotes ) {
			const idKey = String( note.id );
			const present = isAnchorPresent(
				note,
				anchor,
				index,
				entriesRef.current
			);
			if ( present ) {
				seenRef.current.add( idKey );
				if ( timers.has( idKey ) ) {
					clearTimeout( timers.get( idKey ) );
					timers.delete( idKey );
				}
				continue;
			}
			if (
				! seenRef.current.has( idKey ) ||
				timers.has( idKey ) ||
				isSuggestionDecisionInFlight( note.id )
			) {
				continue;
			}
			timers.set(
				idKey,
				setTimeout( () => collect( note, anchor ), GC_GRACE_MS )
			);
		}

		// Redo: a previously collected inline marker is back — restore its
		// note so the marker stays resolvable.
		for ( const [ idKey, info ] of [ ...trashedRef.current ] ) {
			if (
				! isAnchorPresent(
					info.note,
					info.anchor,
					index,
					entriesRef.current
				)
			) {
				continue;
			}
			trashedRef.current.delete( idKey );
			setTrashedVersion( ( version ) => version + 1 );
			saveEntityRecord(
				'root',
				'comment',
				{ id: info.note.id, status: 'hold' },
				{ throwOnError: true }
			).catch( () => {
				// Restore failed; put it back so a later pass retries.
				trashedRef.current.set( idKey, info );
			} );
		}
		/*
		 * Undo: a decision this session made has had its marker put back. The
		 * comment's status is the half undo cannot reach, so reopen it here -
		 * otherwise the run stays marked with no Accept/Reject on it and no way
		 * to clear it through the UI (#73411, F-18). The in-flight guard keeps
		 * this off the decision's own window, where the status can land before
		 * the tree has been mutated.
		 */
		for ( const { note, anchor } of resolvedNotesRef.current ) {
			if (
				isSuggestionDecisionInFlight( note.id ) ||
				! isAnchorPresent( note, anchor, index, entriesRef.current )
			) {
				continue;
			}
			forgetResolvedSuggestion( note.id );
			saveEntityRecord(
				'root',
				'comment',
				{
					id: note.id,
					status: 'hold',
					/*
					 * `pending` rather than clearing the meta: the registered
					 * enum (`pending` / `applied` / `rejected`) rejects the
					 * empty string, and readers treat `pending` and absent
					 * meta the same - awaiting a decision.
					 */
					meta: { _wp_suggestion_status: 'pending' },
				},
				{ throwOnError: true }
			).catch( () => {
				// Reopen failed; leave it recorded so a later pass retries.
				rememberResolvedSuggestion( note.id );
			} );
		}

		// `presenceSignature` fully determines the work; the other values are
		// read through refs or stable.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ presenceSignature ] );

	// Cancel scheduled collections on unmount.
	useEffect( () => {
		const timers = timersRef.current;
		return () => {
			for ( const timer of timers.values() ) {
				clearTimeout( timer );
			}
			timers.clear();
		};
	}, [] );

	return null;
}
