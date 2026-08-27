import { useCallback, useEffect, useRef } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { STORE_NAME } from '../name';

/**
 * Idle period after which a run of edits is considered finished. Matches the
 * interval rich text uses for block attributes, so typing into a field backed
 * by an entity record builds undo levels at the same rate as typing into a
 * block.
 *
 * @type {number}
 */
const RUN_TIMEOUT = 1000;

/**
 * Hook that returns a function to edit an entity record, coalescing a run of
 * rapid successive edits into a single undo level.
 *
 * Typing into a field backed by an entity record dispatches one edit per
 * keystroke. Left alone each of those becomes its own undo level, so undo
 * unwinds the text one character at a time. This hook opens an undo level on
 * the first edit of a run and stages the rest into it, which is the behaviour
 * rich text already gives block attributes.
 *
 * Edits are dispatched immediately and only the undo boundary is deferred, so
 * the rendered value and the record's dirty state stay in step with what was
 * typed.
 *
 * @param {string}        kind       The entity kind.
 * @param {string}        name       The entity name.
 * @param {number|string} [recordId] The entity record ID.
 *
 * @return {Function} Function accepting the edits, and optionally the options
 *                    to pass on to `editEntityRecord`.
 */
export default function useCoalescedEntityEdit( kind, name, recordId ) {
	const { editEntityRecord } = useDispatch( STORE_NAME );
	const timeoutRef = useRef();
	const hasOpenRunRef = useRef( false );

	useEffect(
		() => () => {
			window.clearTimeout( timeoutRef.current );
		},
		[]
	);

	return useCallback(
		( edits, options ) => {
			// The first edit of a run creates its own undo level, and the
			// rest are staged into it. Opening the level with the first edit
			// rather than before the run means the text cannot be absorbed
			// into whatever preceded it, such as the block's insertion.
			editEntityRecord( kind, name, recordId, edits, {
				...options,
				isCached: hasOpenRunRef.current,
			} );

			hasOpenRunRef.current = true;
			window.clearTimeout( timeoutRef.current );
			timeoutRef.current = window.setTimeout( () => {
				hasOpenRunRef.current = false;
			}, RUN_TIMEOUT );
		},
		[ kind, name, recordId, editEntityRecord ]
	);
}
