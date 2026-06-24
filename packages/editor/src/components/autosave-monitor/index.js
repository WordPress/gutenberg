/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Calls `callback` every `intervalInSeconds`. The latest `callback` is always
 * invoked without resetting the timer.
 *
 * @param {Function} callback          Function to call on each tick.
 * @param {number}   intervalInSeconds Seconds between ticks.
 */
function useInterval( callback, intervalInSeconds ) {
	const callbackRef = useRef( callback );

	useEffect( () => {
		callbackRef.current = callback;
	}, [ callback ] );

	useEffect( () => {
		// Interval can be undefined before editor settings are populated.
		if ( ! intervalInSeconds ) {
			return;
		}

		const id = setInterval(
			() => callbackRef.current(),
			intervalInSeconds * 1000
		);
		return () => clearInterval( id );
	}, [ intervalInSeconds ] );
}

/**
 * Monitors the changes made to the edited post and triggers autosave if necessary.
 *
 * The post is checked every `interval` seconds and autosaved when there is something new to save.
 *
 * @param {Object}   props            The component props.
 * @param {number}   [props.interval] Time in seconds between checks. Defaults to the editor's
 *                                    `autosaveInterval` setting.
 * @param {Function} [props.autosave] Function to call when changes need to be saved. Defaults to the
 *                                    editor store's `autosave` action.
 *
 * @example
 * ```jsx
 * <AutosaveMonitor interval={ 30 } />
 * ```
 */
export default function AutosaveMonitor( { interval, autosave } ) {
	const { autosave: autosaveAction } = useDispatch( editorStore );
	const triggerAutosave = autosave ?? autosaveAction;

	const { getReferenceByDistinctEdits } = useSelect( coreStore );
	const { isEditedPostDirty, isEditedPostAutosaveable, isAutosavingPost } =
		useSelect( editorStore );

	const autosaveInterval = useSelect(
		( select ) => {
			if ( interval !== undefined ) {
				return interval;
			}

			return select( editorStore ).getEditorSettings().autosaveInterval;
		},
		[ interval ]
	);

	// Reference of the edits last considered for autosaving. Mutable state that
	// must not trigger a re-render, hence a ref.
	const lastEditsReferenceRef = useRef();

	useInterval( () => {
		// The post can't be autosaved yet (e.g. its existing autosave is still
		// loading). Keep any pending edits and try again on the next tick.
		if ( ! isEditedPostAutosaveable() ) {
			return;
		}

		const editsReference = getReferenceByDistinctEdits();
		const hasNewEdits = editsReference !== lastEditsReferenceRef.current;
		if ( hasNewEdits && isEditedPostDirty() && ! isAutosavingPost() ) {
			// Only consume the edits reference when we autosave,
			// so edits made during an in-flight autosave aren't skipped.
			lastEditsReferenceRef.current = editsReference;
			triggerAutosave();
		}
	}, autosaveInterval );

	return null;
}
