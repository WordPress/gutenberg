/**
 * Garbage collection for orphaned suggestion notes.
 *
 * Every suggestion note is anchored to something the user can see (see
 * anchor-index.ts). When the anchor disappears without the note being
 * resolved — the classic case is Ctrl+Z right after making the suggestion,
 * but deleting the marked text in Editing intent lands here too — the note
 * has nothing left to accept or reject. Leaving it behind produces the
 * orphaned-note problem called out in
 * `docs/explanations/architecture/suggestions.md`: a pending suggestion in
 * the sidebar whose Apply/Reject can no longer do anything.
 *
 * This component watches the anchor of the current user's own pending
 * suggestion notes and trashes a note when an anchor it has previously
 * observed disappears. Only their own: removing someone else's suggestion is
 * an edit to the post, and the save pass records it on their note as
 * `outdated` rather than anyone's editor deleting their work.
 * Transition-based on purpose: a note whose anchor was never seen (editor
 * still loading, marker write still in flight) is never collected, so load
 * order can't mass-trash healthy suggestions.
 *
 * Redo support: when a collected anchor reappears (Ctrl+Shift+Z bringing an
 * inline marker back, or an undo restoring the move a removal replaced),
 * the trashed note is restored to pending so the anchor stays resolvable.
 * Structural redo instead re-lands as a real edit under the undo guard's
 * adoption token (see suggestion-undo-guard.js). A note an undo
 * reopened after a decision is the mirror case: when a redo takes its anchor
 * away again, it is the decision landing again, so the note gets its
 * decision back rather than being trashed.
 *
 * Deliberate-removal races are excluded three ways: apply/reject decisions
 * register their comment id as in flight (provider.js) for their duration,
 * the note's local record must still be pending (`status: 'hold'`, status
 * absent or `pending`) at collection time, and so must the server's copy,
 * read fresh before trashing - a peer's decision syncs its content change
 * before this session's thread list hears of it.
 *
 * A note somebody has replied to is never collected (#81958). Trashing a root
 * comment takes its replies with it, so collecting one would turn "I withdrew
 * my suggestion" into "I deleted your comment" — silently, and for a reply the
 * person pressing Ctrl+Z may never have seen. The note is kept and the
 * withdrawal announced instead, the same trade the format-toggle path makes
 * (see suggestion-format-keyboard.ts). The replies are counted at the server,
 * not in the thread list this session loaded: the reply that has to stop a
 * collection is typically one a colleague wrote after the editor opened.
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	describeAnchor,
	getAnchorIndex,
	inlineAttributesOf,
	isAnchorPresent,
} from './anchor-index';
import type { SuggestionAnchor } from './anchor-index';
import {
	forgetReopenedDecision,
	forgetResolvedSuggestion,
	getReopenedDecision,
	getSuggestionDecisionState,
	getSuggestionsResolvedThisSession,
	isRecentRedo,
	isSuggestionDecisionInFlight,
	rememberReopenedDecision,
	rememberResolvedSuggestion,
	takeWithdrawnAnchor,
} from './decision-state';
import {
	PENDING,
	getDecision,
	getProvisionalStatus,
	getSuggestionStatus,
	isPendingStatus,
} from './suggestion-status';
import { store as editorStore } from '../../store';
import { getNoteThreadsQuery, useNoteThreads } from '../collab-sidebar/hooks';

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
	const currentUserId = useSelect(
		( select ) =>
			( select( coreStore ) as any ).getCurrentUser()?.id ?? null,
		[]
	);
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createNotice } = useDispatch( noticesStore );
	const registry = useRegistry();

	/*
	 * Pending suggestion root notes: the current user's own, which this
	 * collector may trash, and any other a redo may resolve again (an undo
	 * reopened a decision on it). Replies and decided notes have no anchor
	 * contract. While the current user is unresolved nothing is owned.
	 */
	const suggestionNotes: Array< {
		note: any;
		anchor: SuggestionAnchor;
		own: boolean;
	} > = [];
	/*
	 * Notes this session applied or rejected. Their marker should be gone; if
	 * it is back, an undo walked the block half of the decision back while the
	 * note stayed resolved, and the note has to follow (#73411, F-18).
	 */
	const resolvedNotes: Array< { note: any; anchor: SuggestionAnchor } > = [];
	const resolvedIds = getSuggestionsResolvedThisSession( registry );
	for ( const note of notes ?? [] ) {
		if ( note.parent !== 0 ) {
			continue;
		}
		const anchor = describeAnchor( note );
		if ( ! anchor ) {
			continue;
		}
		if (
			note.status === 'hold' &&
			isPendingStatus( getSuggestionStatus( note ) )
		) {
			const own =
				currentUserId !== null &&
				Number( note.author ) === Number( currentUserId );
			if ( own || getReopenedDecision( registry, note.id ) ) {
				suggestionNotes.push( { note, anchor, own } );
			}
		} else if ( resolvedIds.has( String( note.id ) ) ) {
			resolvedNotes.push( { note, anchor } );
		}
	}

	// Notes this collector trashed, kept so a marker restored by redo can
	// resurrect its note. Version state re-runs the presence probe below
	// when the map changes.
	const trashedRef = useRef(
		new Map< string, { note: any; anchor: SuggestionAnchor } >()
	);
	const [ trashedVersion, setTrashedVersion ] = useState( 0 );

	/*
	 * Latest render's values, read by the collector effect below rather than
	 * listed in its deps - the effect must run on a presence change, not on
	 * every note or block edit. Written in an effect of their own, declared
	 * first so the collector sees this render's values.
	 */
	const resolvedNotesRef = useRef( resolvedNotes );
	useEffect( () => {
		resolvedNotesRef.current = resolvedNotes;
	} );

	/*
	 * Reactive presence signature. Computed inside `useSelect` so it updates
	 * whenever block content changes (a marker can disappear without the
	 * notes list changing). Mirrors the signature pattern in
	 * annotate-suggestions.js.
	 */
	const presenceSignature = useSelect(
		( select ) => {
			// Nothing tracked (the common case outside Suggest mode): skip
			// the block walk entirely.
			if (
				! suggestionNotes.length &&
				! resolvedNotes.length &&
				! trashedRef.current.size
			) {
				return '';
			}
			const index = getAnchorIndex(
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
						isAnchorPresent( note, anchor, index ) ? 1 : 0
					}`
				);
			}
			for ( const [ idKey, info ] of trashedRef.current ) {
				parts.push(
					`t${ idKey }:${
						isAnchorPresent( info.note, info.anchor, index ) ? 1 : 0
					}`
				);
			}
			for ( const { note, anchor } of resolvedNotes ) {
				parts.push(
					`r${ note.id }:${
						isAnchorPresent( note, anchor, index ) ? 1 : 0
					}`
				);
			}
			return parts.join( '|' );
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ notes, trashedVersion ]
	);

	// Anchors observed at least once this session, keyed by note id.
	const seenRef = useRef( new Set() );
	// Scheduled collections, keyed by note id.
	const timersRef = useRef( new Map() );
	/*
	 * Notes spared because they carry replies. Kept so the reprieve is decided
	 * — and announced — once per withdrawal rather than on every later edit
	 * that re-runs the probe. Cleared when the anchor comes back, so a note
	 * whose replies are gone by the next withdrawal is collected normally.
	 */
	const keptRef = useRef( new Set< string >() );

	useEffect( () => {
		const blockEditor = registry.select( blockEditorStore );
		const timers = timersRef.current;
		const indexAnchors = () =>
			getAnchorIndex(
				blockEditor,
				inlineAttributesOf(
					suggestionNotes,
					trashedRef.current.values(),
					resolvedNotesRef.current
				)
			);
		const index = indexAnchors();

		/*
		 * The note as the server has it: whether it is still pending, and
		 * whether anyone has answered it. Asked of the server rather than of
		 * the thread list `useNoteThreads` resolved when the editor loaded.
		 * Nothing refreshes that list for replies written elsewhere, which is
		 * the case the reply guard exists for (#81958): a colleague answers the
		 * note in their own session, the copy here still says nobody did, and
		 * the withdrawal takes their comment with it. Likewise a peer's
		 * decision: its content change syncs here before its status does. A
		 * withdrawal is rare and already waits out a grace period, so it can
		 * afford the round trip.
		 *
		 * Resolves to `null` when the answer is unknown - a request that failed.
		 */
		const fetchServerState = async ( noteId: number | string ) => {
			try {
				const [ record, replies ]: any[] = await Promise.all( [
					apiFetch( {
						path: addQueryArgs( `/wp/v2/comments/${ noteId }`, {
							context: 'edit',
							_fields: 'status,meta',
						} ),
					} ),
					apiFetch( {
						path: addQueryArgs( '/wp/v2/comments', {
							...getNoteThreadsQuery( postId as number ),
							parent: noteId,
							// Existence is the whole question.
							per_page: 1,
							_fields: 'id',
						} ),
					} ),
				] );
				return {
					pending:
						record?.status === 'hold' &&
						isPendingStatus( getSuggestionStatus( record ) ),
					replied: replies.length > 0,
				};
			} catch {
				return null;
			}
		};

		/*
		 * Whether the withdrawal still stands. Probed before the reply fetch and
		 * again after it: the fetch is a real round trip, and a redo can put the
		 * anchor back - or a peer decide the note - while it is in flight.
		 */
		const isWithdrawn = ( note: any, anchor: SuggestionAnchor ) => {
			if ( isAnchorPresent( note, anchor, indexAnchors() ) ) {
				return false;
			}
			if ( isSuggestionDecisionInFlight( registry, note.id ) ) {
				return false;
			}
			const record: any = registry
				.select( coreStore )
				.getEntityRecord( 'root', 'comment', note.id );
			return (
				!! record &&
				record.status === 'hold' &&
				isPendingStatus( getSuggestionStatus( record ) )
			);
		};

		const collect = async (
			note: any,
			anchor: SuggestionAnchor,
			attempt = 1
		) => {
			timers.delete( String( note.id ) );
			// Recheck against settled state: the anchor may be back (redo beat
			// the grace period) or the note may have been decided.
			if ( ! isWithdrawn( note, anchor ) ) {
				return;
			}
			const server = await fetchServerState( note.id );
			if ( ! isWithdrawn( note, anchor ) ) {
				return;
			}
			/*
			 * Unknown, not "nobody replied". Keep the note, but say nothing and
			 * latch nothing: announcing would assert replies that may not
			 * exist, and sparing it for the session would put a healthy orphan
			 * out of the collector's reach over one failed request. The next
			 * presence change asks again.
			 */
			if ( server === null ) {
				return;
			}
			// Decided or outdated elsewhere: the anchor left with the decision.
			if ( ! server.pending ) {
				return;
			}
			const { replied } = server;
			// The note is a discussion now, not just a proposal: keep it, and
			// say so — the person who withdrew the suggestion is the only one
			// who can see that the note outlived it.
			if ( replied ) {
				keptRef.current.add( String( note.id ) );
				/*
				 * The replies that spared it may be news to this session too.
				 * Drop the stale list so the sidebar can show what the snackbar
				 * is talking about.
				 */
				( registry.dispatch( coreStore ) as any ).invalidateResolution(
					'getEntityRecords',
					[
						'root',
						'comment',
						getNoteThreadsQuery( postId as number ),
					]
				);
				createNotice(
					'info',
					__(
						'Suggestion withdrawn. The note is kept because it has replies.'
					),
					{ type: 'snackbar', isDismissible: true }
				);
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
					/*
					 * Every anchor lives in block content, so undo or redo
					 * can bring it back - an inline mark, an attribute
					 * proposal, or a structural marker, such as the move a
					 * removal replaced coming back when the removal is
					 * undone. The note then has to come back with it.
					 */
					trashedRef.current.set( String( note.id ), {
						note,
						anchor,
					} );
					setTrashedVersion( ( version ) => version + 1 );
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

		for ( const { note, anchor, own } of suggestionNotes ) {
			const idKey = String( note.id );
			const present = isAnchorPresent( note, anchor, index );
			if ( present ) {
				takeWithdrawnAnchor( registry, idKey );
				seenRef.current.add( idKey );
				keptRef.current.delete( idKey );
				if ( timers.has( idKey ) ) {
					clearTimeout( timers.get( idKey ) );
					timers.delete( idKey );
				}
				continue;
			}
			/*
			 * Redo of a decision an undo walked back: the marker is gone
			 * because the decision landed again, not because the suggestion
			 * was withdrawn, so the note is resolved again rather than
			 * collected. Held in flight for the save, like a decision, so
			 * the collector leaves it alone meanwhile.
			 */
			const decision = getReopenedDecision( registry, idKey );
			if (
				decision &&
				seenRef.current.has( idKey ) &&
				isRecentRedo( registry ) &&
				! isSuggestionDecisionInFlight( registry, note.id )
			) {
				if ( timers.has( idKey ) ) {
					clearTimeout( timers.get( idKey ) );
					timers.delete( idKey );
				}
				const { decisionsInFlight } =
					getSuggestionDecisionState( registry );
				decisionsInFlight.add( idKey );
				forgetReopenedDecision( registry, idKey );
				saveEntityRecord(
					'root',
					'comment',
					{
						id: note.id,
						// Provisional again: only a post save makes it final.
						status: 'hold',
						meta: {
							_wp_suggestion_status:
								getProvisionalStatus( decision ),
						},
					},
					{ throwOnError: true }
				)
					.then( () => {
						seenRef.current.delete( idKey );
						rememberResolvedSuggestion( registry, idKey );
					} )
					.catch( () => {
						rememberReopenedDecision( registry, idKey, decision );
					} )
					.finally( () => decisionsInFlight.delete( idKey ) );
				continue;
			}
			if ( takeWithdrawnAnchor( registry, idKey ) ) {
				seenRef.current.add( idKey );
			}
			if (
				! own ||
				! seenRef.current.has( idKey ) ||
				timers.has( idKey ) ||
				keptRef.current.has( idKey ) ||
				isSuggestionDecisionInFlight( registry, note.id )
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
			if ( ! isAnchorPresent( info.note, info.anchor, index ) ) {
				continue;
			}
			trashedRef.current.delete( idKey );
			setTrashedVersion( ( version ) => version + 1 );
			saveEntityRecord(
				'root',
				'comment',
				{
					id: info.note.id,
					status: 'hold',
					meta: { _wp_suggestion_status: PENDING },
				},
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
				isSuggestionDecisionInFlight( registry, note.id ) ||
				! isAnchorPresent( note, anchor, index )
			) {
				continue;
			}
			forgetResolvedSuggestion( registry, note.id );
			/*
			 * Its anchor is on screen now, so it counts as seen: an undo
			 * further back can withdraw it before the reopen below lands.
			 */
			seenRef.current.add( String( note.id ) );
			const decision = getDecision( getSuggestionStatus( note ) );
			if ( decision ) {
				rememberReopenedDecision( registry, note.id, decision );
			}
			saveEntityRecord(
				'root',
				'comment',
				{
					id: note.id,
					status: 'hold',
					/*
					 * `pending` rather than clearing the meta: the registered
					 * enum rejects the empty string, and readers treat
					 * `pending` and absent meta the same - awaiting a
					 * decision.
					 */
					meta: { _wp_suggestion_status: PENDING },
				},
				{ throwOnError: true }
			).catch( () => {
				// Reopen failed; leave it recorded so a later pass retries.
				forgetReopenedDecision( registry, note.id );
				rememberResolvedSuggestion( registry, note.id );
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
