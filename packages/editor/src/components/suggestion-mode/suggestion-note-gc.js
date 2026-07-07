/**
 * Garbage collection for orphaned suggestion notes.
 *
 * Every suggestion note is anchored to something the user can see: a
 * structural `metadata.suggestion` marker on a block, or a pending attribute
 * entry in the suggestion overlay. When the anchor disappears without the
 * note being resolved — the classic case is Ctrl+Z right after making the
 * suggestion, but deleting the block in Editing intent lands here too — the
 * note has nothing left to accept or reject. Leaving it behind produces the
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
 * Deliberate-removal races are excluded two ways: apply/reject decisions
 * register their comment id as in flight (provider.js) for their duration,
 * and the note's local record must still be pending (`status: 'hold'`, no
 * `_wp_suggestion_status`) at collection time.
 */

/**
 * WordPress dependencies
 */
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import {
	findStructuralOp,
	isSuggestionDecisionInFlight,
	parseSuggestionPayload,
} from './provider';
import { getNoteIdsFromMetadata } from '../collab-sidebar/utils';
import { store as editorStore } from '../../store';
import { useNoteThreads } from '../collab-sidebar/hooks';

/*
 * Grace period between observing an anchor's disappearance and trashing the
 * note. Absorbs transient states (multi-dispatch undo application) and gives
 * the fire-time recheck a settled tree.
 */
const GC_GRACE_MS = 500;

const PENDING_MARKER_BY_OP = {
	'block-remove': 'pending-remove',
	'block-insert-after': 'pending-insert',
	'block-move': 'pending-move',
};

/**
 * Describe the anchor a suggestion note must keep to stay meaningful.
 *
 * @param {Object} note Note comment record.
 * @return {Object|null} Anchor descriptor, or null when the note is not a
 * pending suggestion this collector manages.
 */
function describeAnchor( note ) {
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
	// Attribute-set suggestions: anchored to their overlay entry. Their
	// note lifecycle is normally owned by the auto-saver (which trashes a
	// note when the overlay reverts to baseline); the collector only covers
	// the entry being pruned wholesale (block deleted outside Suggest mode).
	return { kind: 'attribute' };
}

/**
 * Whether a note's anchor is currently present in the editor.
 *
 * @param {Object} note        Note comment record.
 * @param {Object} anchor      Anchor descriptor from `describeAnchor`.
 * @param {Object} blockEditor Block-editor selectors.
 * @param {Object} entries     Suggestion overlay entries.
 * @return {boolean} True when the anchor exists.
 */
function isAnchorPresent( note, anchor, blockEditor, entries ) {
	const idKey = String( note.id );
	if ( anchor.kind === 'attribute' ) {
		return Object.values( entries ?? {} ).some(
			( entry ) =>
				entry.commentId !== null &&
				entry.commentId !== undefined &&
				String( entry.commentId ) === idKey
		);
	}
	const liveClientIds = blockEditor.getClientIdsWithDescendants?.() ?? [];
	for ( const clientId of liveClientIds ) {
		const metadata = blockEditor.getBlockAttributes( clientId )?.metadata;
		if ( metadata?.suggestion?.type !== anchor.pendingType ) {
			continue;
		}
		if (
			getNoteIdsFromMetadata( metadata ).some(
				( noteId ) => String( noteId ) === idKey
			)
		) {
			return true;
		}
	}
	return false;
}

/**
 * Invisible component that trashes suggestion notes whose anchor disappears.
 * Mounted for every intent — withdrawals can happen outside Suggest mode too.
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
	const suggestionNotes = [];
	for ( const note of notes ?? [] ) {
		if ( note.parent !== 0 || note.status !== 'hold' ) {
			continue;
		}
		const anchor = describeAnchor( note );
		if ( anchor ) {
			suggestionNotes.push( { note, anchor } );
		}
	}

	const entriesRef = useRef( entries );
	entriesRef.current = entries;
	const clearOverlayRef = useRef( clearOverlay );
	clearOverlayRef.current = clearOverlay;

	/*
	 * Reactive presence signature. Computed inside `useSelect` so it updates
	 * whenever block content changes (a marker can disappear without the
	 * notes list changing).
	 */
	const presenceSignature = useSelect(
		( select ) => {
			const blockEditor = select( blockEditorStore );
			const parts = [];
			for ( const { note, anchor } of suggestionNotes ) {
				parts.push(
					`${ note.id }:${
						isAnchorPresent( note, anchor, blockEditor, entries )
							? 1
							: 0
					}`
				);
			}
			return parts.join( '|' );
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ notes, entries ]
	);

	// Anchors observed at least once this session, keyed by note id.
	const seenRef = useRef( new Set() );
	// Scheduled collections, keyed by note id.
	const timersRef = useRef( new Map() );

	useEffect( () => {
		const blockEditor = registry.select( blockEditorStore );
		const timers = timersRef.current;

		const collect = ( note, anchor ) => {
			timers.delete( String( note.id ) );
			// Recheck against settled state: the anchor may be back or the
			// note may have been decided.
			if (
				isAnchorPresent( note, anchor, blockEditor, entriesRef.current )
			) {
				return;
			}
			if ( isSuggestionDecisionInFlight( note.id ) ) {
				return;
			}
			const record = registry
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
					// The next presence change retries; a transient REST
					// failure must not strand a timer.
				} );
		};

		for ( const { note, anchor } of suggestionNotes ) {
			const idKey = String( note.id );
			const present = isAnchorPresent(
				note,
				anchor,
				blockEditor,
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
