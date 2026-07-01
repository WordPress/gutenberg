/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { useSuggestionOverlay } from './overlay-context';
import { INLINE_OP_TYPE, useSuggestionsProvider } from './provider';
import {
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_DELETION,
	applyEditPlan,
} from '../inline-suggestions';

/**
 * Owns the write side of text-edit suggestions that reach a block as a whole new
 * `content` value rather than a `beforeinput` the typing/deletion keyboards
 * intercept.
 *
 * The keyboards catch plain typing, word/line delete, cut, and single-line paste
 * on their input events and cancel them before the browser applies them. Edits
 * that don't surface as one of those events — a committed IME composition,
 * autocorrect (`insertReplacementText`), a drag-drop, a multi-line paste — fall
 * through to RichText's `onChange`, which the overlay HOC sees as a fresh
 * `content` value. The HOC diffs it into a marker plan (`planEditMarkers`) and,
 * when the plan is one this handler can execute, hands it here; this single
 * mounted component opens the note(s) and writes the marker(s), bypassing the
 * suggest-mode interceptor exactly as the typing keyboards do. Keeping the heavy
 * `useSuggestionsProvider` in one component rather than every block's render is
 * why this is a singleton, mirroring `SuggestionFormatKeyboard`.
 *
 * Only plans whose actions all open a fresh note (`insert-add`, `wrap-del`) are
 * routed here by the HOC; plans that edit an existing marker or that the diff
 * can't resolve are left to the overlay path, so this handler always has a note
 * to create for every id the plan consumes.
 *
 * @return {null} Renders nothing.
 */
export default function SuggestionContentReconciler() {
	const authorId = useSelect(
		( select ) => select( coreStore ).getCurrentUser()?.id ?? null,
		[]
	);
	const { createSuggestion } = useSuggestionsProvider();
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { registerContentHandler, requestInterceptorBypass } =
		useSuggestionOverlay();

	// Per-clientId guard so a second edit on the same block while its note is
	// still being created doesn't open a duplicate note.
	const inFlightRef = useRef( new Set() );

	const handleContentEdit = useCallback(
		async ( { clientId, blockName, prevContent, plan } ) => {
			const actions = plan?.actions ?? [];
			if ( actions.length === 0 ) {
				return;
			}
			if ( inFlightRef.current.has( clientId ) ) {
				return;
			}
			inFlightRef.current.add( clientId );
			try {
				// Open one note per action that needs a fresh id, in the order
				// the actions appear — the same order `applyEditPlan` consumes
				// `ids`. A `wrap-del` action becomes a deletion note; every other
				// id-consuming action (`insert-add`) becomes an addition note.
				const ids = [];
				for ( const action of actions ) {
					if ( ! action.newNote ) {
						continue;
					}
					const suggestionType =
						action.type === 'wrap-del'
							? SUGGESTION_TYPE_DELETION
							: SUGGESTION_TYPE_ADDITION;
					const record = await createSuggestion( {
						clientId,
						blockName,
						operations: [
							{
								type: INLINE_OP_TYPE,
								attribute: 'content',
								suggestionType,
							},
						],
					} );
					const id = record?.id;
					if ( ! id ) {
						// A note failed to open; abandon rather than write a
						// marker with a missing id.
						return;
					}
					ids.push( id );
				}
				const marked = applyEditPlan( prevContent, actions, {
					authorId,
					ids,
				} );
				requestInterceptorBypass( clientId );
				updateBlockAttributes( clientId, { content: marked } );
			} catch {
				// `createSuggestion` surfaces its own error notice; there is
				// nothing to write on failure.
			} finally {
				inFlightRef.current.delete( clientId );
			}
		},
		[
			authorId,
			createSuggestion,
			updateBlockAttributes,
			requestInterceptorBypass,
		]
	);

	// Register the handler with the overlay context so the per-block HOC can
	// hand content edits off to it. Re-registers whenever the handler identity
	// changes (e.g. `createSuggestion` rebinds on post modification).
	useEffect(
		() => registerContentHandler( handleContentEdit ),
		[ registerContentHandler, handleContentEdit ]
	);

	return null;
}
