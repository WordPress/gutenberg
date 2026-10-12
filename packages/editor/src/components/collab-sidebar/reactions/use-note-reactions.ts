import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { store as editorStore } from '../../../store';

interface ReactionSummaryEntry {
	count: number;
	// The current user's reaction comment ID, used to delete it again;
	// 0 when they have not reacted with this emoji.
	current_user_reaction: number;
}

/**
 * The reaction summary keyed by emoji hex key.
 */
export type ReactionSummary = Record< string, ReactionSummaryEntry >;

/**
 * The parts of a note comment record that reactions read.
 */
interface ReactionTarget {
	id: number;
	reaction_summary?: ReactionSummary | null;
}

/**
 * Folds a completed reaction toggle into a cached note record.
 *
 * Keeps `reaction_summary` usable until the notes list, which every comment
 * save invalidates, comes back with the authoritative one: without it, a
 * second toggle reads a stale `current_user_reaction` and takes the wrong
 * branch.
 *
 * @param note   The cached note record.
 * @param hexKey The reaction hex key that changed.
 * @param change The comment ID of the current user's reaction that was
 *               added or removed.
 * @return The note with an updated `reaction_summary`.
 */
export function applyReactionDelta< T extends ReactionTarget >(
	note: T,
	hexKey: string,
	change: { added: number } | { removed: number }
): T {
	const summary: ReactionSummary = { ...( note.reaction_summary || {} ) };
	const entry = summary[ hexKey ];

	if ( 'added' in change ) {
		// Concurrent adds converge server-side on one surviving row, so a
		// repeated ID is already counted.
		if ( entry?.current_user_reaction === change.added ) {
			return note;
		}
		summary[ hexKey ] = {
			count: ( entry?.count || 0 ) + 1,
			current_user_reaction: change.added,
		};
	} else {
		// A refresh may already have dropped the reaction; decrementing again
		// would hide someone else's.
		if ( entry?.current_user_reaction !== change.removed ) {
			return note;
		}
		const count = entry.count - 1;
		if ( count > 0 ) {
			summary[ hexKey ] = { count, current_user_reaction: 0 };
		} else {
			delete summary[ hexKey ];
		}
	}

	return { ...note, reaction_summary: summary };
}

/*
 * A second click before the first toggle lands reads the same summary and
 * would repeat the request.
 */
const pendingToggles = new Set< string >();

/**
 * A note's reaction summary and a callback to toggle one of the current
 * user's reactions.
 *
 * @param noteId The note comment ID.
 * @return The note's reaction summary and the toggle callback.
 */
export function useNoteReactions(
	noteId: number
): [ ReactionSummary | undefined, ( hexKey: string ) => Promise< void > ] {
	const reactions = useSelect(
		( select ) =>
			(
				select( coreStore ).getEntityRecord(
					'root',
					'comment',
					noteId
				) as ReactionTarget | undefined
			 )?.reaction_summary ?? undefined,
		[ noteId ]
	);
	const { getEntityRecord } = useSelect( coreStore );
	const { getCurrentPostId } = useSelect( editorStore );
	const { createNotice } = useDispatch( noticesStore );
	const { saveEntityRecord, deleteEntityRecord, receiveEntityRecords } =
		useDispatch( coreStore );

	async function toggleReaction( hexKey: string ) {
		const toggleKey = `${ noteId }:${ hexKey }`;
		if ( pendingToggles.has( toggleKey ) ) {
			return;
		}
		pendingToggles.add( toggleKey );

		const getNote = () =>
			getEntityRecord( 'root', 'comment', noteId ) as
				ReactionTarget | undefined;
		const myReactionId =
			getNote()?.reaction_summary?.[ hexKey ]?.current_user_reaction;

		try {
			let change;
			if ( myReactionId ) {
				// Reactions have no trash workflow.
				await deleteEntityRecord(
					'root',
					'comment',
					myReactionId,
					{ force: true },
					{ throwOnError: true }
				);
				change = { removed: myReactionId };
			} else {
				const saved = await saveEntityRecord(
					'root',
					'comment',
					{
						post: getCurrentPostId(),
						type: 'reaction',
						parent: noteId,
						content: hexKey,
						status: 'approve',
					},
					{ throwOnError: true }
				);
				change = { added: saved.id };
			}

			const note = getNote();
			if ( note ) {
				receiveEntityRecords( 'root', 'comment', [
					applyReactionDelta( note, hexKey, change ),
				] );
			}
		} catch ( error ) {
			const { message, code } = ( error ?? {} ) as {
				message?: string;
				code?: string;
			};
			createNotice(
				'error',
				message && code !== 'unknown_error'
					? decodeEntities( message )
					: __( 'An error occurred while performing an update.' ),
				{ type: 'snackbar', isDismissible: true }
			);
		} finally {
			pendingToggles.delete( toggleKey );
		}
	}

	return [ reactions, toggleReaction ];
}
